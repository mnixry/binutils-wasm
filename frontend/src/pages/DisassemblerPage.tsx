import { useEffect, useMemo, useState } from "react";
import * as shlex from "shlex";

import {
  Button,
  Code,
  FileButton,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Stack,
  type StackProps,
  Switch,
  Text,
  TextInput,
  rem,
} from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import {
  IconAssembly,
  IconCopyPlus,
  IconCrane,
  IconSortAscending2,
  IconUpload,
} from "@tabler/icons-react";

import CodeMirrorEditor from "../components/CodeMirrorEditor";
import EndiannessSegmentedControl, {
  Endianness,
} from "../components/EndiannessSegmentedControl";
import ExecutionOutputGroup, {
  ExecutionOutput,
} from "../components/ExecutionOutputGroup";
import ProcessorBitsSegmentedControl, {
  ProcessorBits,
} from "../components/ProcessorBitsSegmentedControl";

function shlexSplit(str: string) {
  try {
    const splitted = shlex.split(str);
    return splitted.find((e) => /^-*$/.test(e)) ? undefined : splitted;
  } catch (e) {
    return undefined;
  }
}

const disassemblers: Record<
  string,
  {
    bfdArch: string;
    acceptEndianness?: Endianness;
    acceptBits?: ProcessorBits;
    bfdNameFactory: (props: { e: Endianness; b: ProcessorBits }) => string;
  }
> = {
  i386: {
    bfdArch: "i386",
    bfdNameFactory: () => "elf32-i386",
  },
  x86_64: {
    bfdArch: "i386:x86-64",
    bfdNameFactory: () => "elf64-x86-64",
  },
  ARMv7: {
    bfdArch: "arm",
    acceptEndianness: "little",
    bfdNameFactory: ({ e }) => `elf32-${e}arm`,
  },
  ARM64: {
    bfdArch: "aarch64",
    acceptEndianness: "little",
    bfdNameFactory: ({ e }) => `elf64-${e}aarch64`,
  },
  AVR: {
    bfdArch: "avr",
    bfdNameFactory: () => "elf32-avr",
  },
  MIPS: {
    bfdArch: "mips",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf32-trad${e}mips`,
  },
  MIPS64: {
    bfdArch: "mips",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf64-trad${e}mips`,
  },
  Alpha: {
    bfdArch: "alpha",
    bfdNameFactory: () => "elf64-alpha",
  },
  CRIS: {
    bfdArch: "cris",
    bfdNameFactory: () => "elf32-cris",
  },
  IA64: {
    bfdArch: "ia64",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf64-ia64-${e}`,
  },
  M68k: {
    bfdArch: "m68k",
    bfdNameFactory: () => "elf32-m68k",
  },
  MSP430: {
    bfdArch: "msp430",
    bfdNameFactory: () => "elf32-msp430",
  },
  PowerPC: {
    bfdArch: "powerpc",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf32-${e}powerpc`,
  },
  PowerPC64: {
    bfdArch: "powerpc",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf64-${e}powerpc`,
  },
  RISC_V: {
    bfdArch: "riscv",
    acceptEndianness: "little",
    acceptBits: 32,
    bfdNameFactory: ({ e, b }) => `elf${b}-${e}riscv`,
  },
  RISC_V64: {
    bfdArch: "riscv",
    acceptEndianness: "little",
    acceptBits: 64,
    bfdNameFactory: ({ e, b }) => `elf${b}-${e}riscv`,
  },
  VAX: {
    bfdArch: "vax",
    bfdNameFactory: () => "elf32-vax",
  },
  S390: {
    bfdArch: "s390",
    acceptBits: 32,
    bfdNameFactory: ({ b }) => `elf${b}-s390`,
  },
  SPARC: {
    bfdArch: "sparc",
    bfdNameFactory: () => "elf32-sparc",
  },
  SPARC64: {
    bfdArch: "sparc",
    bfdNameFactory: () => "elf64-sparc",
  },
  LoongArch32: {
    bfdArch: "LoongArch32",
    bfdNameFactory: () => "elf32-loongarch",
  },
  LoongArch64: {
    bfdArch: "LoongArch64",
    bfdNameFactory: () => "elf64-loongarch",
  },
};

export default function DisassemblerPage(props: StackProps) {
  const [outerGridRef, outerGridDimensions] = useResizeObserver();
  const [innerGroupRef, innerGroupDimensions] = useResizeObserver();
  const innerEditorHeight = useMemo(
    () => outerGridDimensions.height - innerGroupDimensions.height,
    [outerGridDimensions, innerGroupDimensions],
  );

  const [input, setInput] = useState("");
  const [inputBinary, setInputBinary] = useState<Uint8Array>();
  useEffect(() => {
    if (!inputBinary || inputBinary.length === 0) return;
    setInput(
      [...inputBinary]
        .map((x) => x.toString(16).padStart(2, "0"))
        .map((x, i) => (i % 16 === 15 ? `${x}\n` : `${x} `))
        .join("")
        .trim(),
    );
  }, [inputBinary]);
  const formattedInput = useMemo(() => {
    if (input.length === 0) return;
    //check if non-hex characters are present (excluding whitespace and newline)
    if (/[^0-9a-f\s]/gi.test(input)) return;
    //group input into pairs of two, separated by a space, convert to lowercase, 16 groups per line
    const strippedInput = input.replace(/\s/g, "");
    if (strippedInput.length % 2 !== 0) return;
    return strippedInput
      .toLocaleLowerCase()
      .match(/.{2}/g)
      ?.map((x, i) => (i % 16 === 15 ? `${x}\n` : `${x} `))
      .join("")
      .trim();
  }, [input]);
  useEffect(() => {
    if (formattedInput !== undefined) {
      setOutput([]);
      setInputBinary(
        new Uint8Array(formattedInput.split(/\s/g).map((x) => parseInt(x, 16))),
      );
    } else {
      setOutput([
        {
          fd: "stderr",
          program: "internal",
          line: "Invalid input: input must be a string of hex characters.",
        },
      ]);
    }
  }, [formattedInput]);

  const [architecture, setArchitecture] =
    useState<keyof typeof disassemblers>("x86_64");
  const architectureInfo = useMemo(
    () => disassemblers[architecture],
    [architecture],
  );
  useEffect(() => {
    if (!architectureInfo) return;
    const { acceptEndianness, acceptBits } = architectureInfo;
    if (acceptEndianness) setEndianness(acceptEndianness);
    if (acceptBits) setProcessorBits(acceptBits);
  }, [architectureInfo]);

  const [selectedEndianness, setEndianness] = useState<Endianness>("big");
  const [selectedProcessorBits, setProcessorBits] = useState<ProcessorBits>(64);
  const [vma, setVma] = useState(0);
  const [isByte, setIsByte] = useState(true);
  useEffect(() => {
    const { bfdArch, bfdNameFactory } = architectureInfo;
    const bfdName = bfdNameFactory({
      e: selectedEndianness,
      b: selectedProcessorBits,
    });

    const objDumpArgs = ["-w", "-d", `--adjust-vma=${vma}`, "-b", bfdName];
    if (!isByte) objDumpArgs.push("--no-show-raw-insn");
    setObjDumpParamString(shlex.join(objDumpArgs));
    setObjCopyParamString(
      shlex.join([
        "-O",
        bfdName,
        "-B",
        bfdArch,
        "--set-section-flags",
        ".data=code",
        "--rename-section",
        ".data=.text",
      ]),
    );
  }, [
    architectureInfo,
    selectedEndianness,
    selectedProcessorBits,
    isByte,
    vma,
  ]);

  const [objCopyParamString, setObjCopyParamString] = useState("");
  const objCopyParams = useMemo(
    () => shlexSplit(objCopyParamString),
    [objCopyParamString],
  );
  const [objDumpParamString, setObjDumpParamString] = useState("");
  const objDumpParams = useMemo(
    () => shlexSplit(objDumpParamString),
    [objDumpParamString],
  );
  const [output, setOutput] = useState<ExecutionOutput[]>([]);

  return (
    <>
      <Stack h="100%" gap={0} {...props}>
        <Grid justify="space-between" align="center" mb="xs">
          <Grid.Col span="content">
            <Group px="md" align="flex-end">
              <FileButton
                onChange={(f) => {
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = (e) =>
                    e.target?.result &&
                    setInputBinary(
                      new Uint8Array(e.target?.result as ArrayBuffer),
                    );
                  reader.readAsArrayBuffer(f);
                }}
              >
                {(props) => (
                  <Button
                    leftSection={
                      <IconUpload style={{ width: rem(16), height: rem(16) }} />
                    }
                    size="xs"
                    variant="outline"
                    {...props}
                  >
                    Upload binary
                  </Button>
                )}
              </FileButton>
              <Select
                label="Architecture"
                leftSection={
                  <IconCrane
                    style={{ width: rem(16), height: rem(16) }}
                    stroke={1.5}
                  />
                }
                data={Object.keys(disassemblers)}
                value={architecture}
                onChange={(value) =>
                  value && setArchitecture(value as keyof typeof disassemblers)
                }
                size="xs"
                styles={{
                  wrapper: {
                    width: rem(140),
                  },
                }}
              />
              {architectureInfo.acceptEndianness && (
                <EndiannessSegmentedControl
                  value={selectedEndianness}
                  onChange={setEndianness}
                />
              )}
              {architectureInfo.acceptBits && (
                <ProcessorBitsSegmentedControl
                  value={selectedProcessorBits}
                  onChange={setProcessorBits}
                />
              )}
              <TextInput
                label={
                  <>
                    <Code>objcopy</Code> parameters
                  </>
                }
                value={objCopyParamString}
                error={objCopyParams === undefined}
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
                onChange={(e) => setObjCopyParamString(e.currentTarget.value)}
                leftSection={
                  <IconCopyPlus
                    style={{ width: rem(16), height: rem(16) }}
                    stroke={1.5}
                  />
                }
                size="xs"
              />
              <TextInput
                label={
                  <>
                    <Code>objdump</Code> parameters
                  </>
                }
                value={objDumpParamString}
                error={objDumpParams === undefined}
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
                onChange={(e) => setObjDumpParamString(e.currentTarget.value)}
                leftSection={
                  <IconAssembly
                    style={{ width: rem(16), height: rem(16) }}
                    stroke={1.5}
                  />
                }
                size="xs"
              />
              <TextInput
                label="VMA"
                value={vma}
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
                onChange={(e) => setVma(+e.currentTarget.value)}
                leftSection={
                  <IconSortAscending2
                    style={{ width: rem(16), height: rem(16) }}
                    stroke={1.5}
                  />
                }
                size="xs"
              />
              <Stack gap="xs">
                <Text size="xs">Byte</Text>
                <Switch
                  checked={isByte}
                  onChange={(e) => setIsByte(e.currentTarget.checked)}
                  size="sm"
                />
              </Stack>
            </Group>
          </Grid.Col>
          <Grid.Col span="content"></Grid.Col>
        </Grid>
        <SimpleGrid h="100%" cols={2} ref={outerGridRef} spacing="xs">
          <CodeMirrorEditor
            value={input}
            height={`${outerGridDimensions.height}px`}
            onChange={setInput}
            onBlur={() => formattedInput && setInput(formattedInput)}
          />
          <Stack h={outerGridDimensions.height} gap={0}>
            <Stack ref={innerGroupRef}>
              {output.length > 0 && (
                <ExecutionOutputGroup output={output} mb="xs" />
              )}
            </Stack>
            <CodeMirrorEditor
              height={`${innerEditorHeight}px`}
              editable={false}
              lang="gas"
            />
          </Stack>
        </SimpleGrid>
      </Stack>
    </>
  );
}
