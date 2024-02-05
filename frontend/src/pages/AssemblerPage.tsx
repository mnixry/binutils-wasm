import { useCallback, useEffect, useMemo, useState } from "react";
import * as shlex from "shlex";

import binutilsLoader from "@binutils-wasm/binutils";
import gasLoader from "@binutils-wasm/gas";
import {
  Alert,
  Code,
  Collapse,
  Flex,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Stack,
  type StackProps,
  TextInput,
  rem,
} from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import {
  IconAssembly,
  IconCopyMinus,
  IconCrane,
  IconDownload,
  IconInfoCircle,
} from "@tabler/icons-react";

import CodeMirrorEditor from "../components/CodeMirrorEditor";
import CopyingButton from "../components/CopyingButton";
import DownloadButton from "../components/DownloadButton";
import EndiannessSegmentedControl, {
  Endianness,
} from "../components/EndiannessSegmentedControl";
import ExecutionOutputGroup, {
  type ExecutionOutput,
} from "../components/ExecutionOutputGroup";
import ProcessorBitsSegmentedControl, {
  ProcessorBits,
} from "../components/ProcessorBitsSegmentedControl";

const publicPrefix = [
  '.section .shellcode,"awx"',
  ".global _start",
  ".global __start",
  "",
  "_start:",
  "__start:",
];

type SupportedTargets = Parameters<typeof gasLoader>[0];

const assemblers: Record<
  string,
  {
    target: SupportedTargets;
    acceptBits?: ProcessorBits;
    acceptEndianness?: Endianness;
    paramsFactory: (arg: { e: Endianness; b: ProcessorBits }) => string[];
    asmPrefix?: string[];
  }
> = {
  i386: {
    target: "i386-linux-gnu",
    acceptBits: 32,
    paramsFactory: ({ b }) => [`-${b}`],
    asmPrefix: [".intel_syntax noprefix", ".p2align 0"],
  },
  x86_64: {
    target: "x86_64-linux-gnu",
    acceptBits: 64,
    paramsFactory: ({ b }) => [`-${b}`],
    asmPrefix: [".intel_syntax noprefix", ".p2align 0"],
  },
  ARMv7: {
    target: "armv7-linux-gnueabihf",
    acceptEndianness: "little",
    paramsFactory: ({ e }) => [e === "big" ? "-EB" : "-EL"],
    asmPrefix: [".syntax unified", ".arch armv7-a", ".arm", ".p2align 2"],
  },
  ARM64: {
    target: "aarch64-linux-gnu",
    acceptEndianness: "little",
    paramsFactory: ({ e }) => [e === "big" ? "-EB" : "-EL"],
  },
  MIPS: {
    target: "mips-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 32,
    paramsFactory: ({ e, b }) => [e === "big" ? "-EB" : "-EL", `-${b}`],
    asmPrefix: [".set mips2", ".set noreorder", ".p2align 2"],
  },
  MIPS64: {
    target: "mips64-linux-gnuabi64",
    acceptEndianness: "big",
    acceptBits: 64,
    paramsFactory: ({ e, b }) => [e === "big" ? "-EB" : "-EL", `-${b}`],
  },
  SPARC: {
    target: "sparc-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 32,
    paramsFactory: ({ e, b }) => [e === "big" ? "-EB" : "-EL", `-${b}`],
  },
  SPARC64: {
    target: "sparc64-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 64,
    paramsFactory: ({ e, b }) => [e === "big" ? "-EB" : "-EL", `-${b}`],
  },
  PowerPC: {
    target: "powerpc-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 32,
    paramsFactory: ({ e, b }) => [
      e === "big" ? "-mbig" : "-mlittle",
      `-mppc${b}`,
    ],
  },
  PowerPC64: {
    target: "powerpc64-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 64,
    paramsFactory: ({ e, b }) => [
      e === "big" ? "-mbig" : "-mlittle",
      `-mppc${b}`,
    ],
  },
  IA64: {
    target: "ia64-linux-gnu",
    acceptEndianness: "big",
    paramsFactory: ({ e }) => [e === "big" ? "-mbe" : "-mle"],
  },
  RISC_V32: {
    target: "riscv32-linux-gnu",
    paramsFactory: () => ["-march=rv32gc", "-mabi=ilp32"],
  },
  RISC_V64: {
    target: "riscv64-linux-gnu",
    paramsFactory: () => ["-march=rv64gc", "-mabi=lp64"],
  },
  LoongArch32: {
    target: "loongarch32-linux-gnu",
    paramsFactory: () => [],
  },
  LoongArch64: {
    target: "loongarch64-linux-gnu",
    paramsFactory: () => [],
  },
};

function shlexSplit(str: string) {
  try {
    return shlex.split(str);
  } catch (e) {
    return undefined;
  }
}

export default function AssemblerPage(props: StackProps) {
  const [containerRef, dimensions] = useResizeObserver();

  const [architecture, setArchitecture] =
    useState<keyof typeof assemblers>("x86_64");
  const architectureInfo = useMemo(
    () => assemblers[architecture],
    [architecture],
  );
  useEffect(() => {
    if (architectureInfo.acceptEndianness)
      setEndianness(architectureInfo.acceptEndianness);
    if (architectureInfo.acceptBits)
      setProcessorBits(architectureInfo.acceptBits);
    setInput(
      publicPrefix.join("\n") +
        "\n\t" +
        (architectureInfo.asmPrefix?.join("\n\t") ?? "") +
        "\n\t",
    );
  }, [architecture, architectureInfo]);

  const [selectedEndianness, setEndianness] = useState<Endianness>("big");
  const [selectedProcessorBits, setProcessorBits] = useState<ProcessorBits>(64);
  useEffect(() => {
    const params = architectureInfo.paramsFactory({
      e: selectedEndianness,
      b: selectedProcessorBits,
    });
    setAsParamString(shlex.join(params));
  }, [architectureInfo, selectedEndianness, selectedProcessorBits]);

  const [asParamString, setAsParamString] = useState("");
  const asParams = useMemo(() => shlexSplit(asParamString), [asParamString]);
  const [objcopyParamString, setObjcopyParamString] = useState("-j .shellcode");
  const objcopyParams = useMemo(
    () => shlexSplit(objcopyParamString),
    [objcopyParamString],
  );

  const [input, setInput] = useState("");
  const [output, setOutput] = useState<ExecutionOutput[]>([]);
  const [data, setData] = useState<Uint8Array>();
  const hexData = useMemo(
    () =>
      data?.length
        ? [...data]
            .map(
              (byte, index) =>
                byte.toString(16).padStart(2, "0") +
                ((index + 1) % 16 === 0 ? "\n" : " "),
            )
            .join("")
            .trim()
        : undefined,
    [data],
  );

  const [elfData, setElfData] = useState<Uint8Array>();

  const assemble = useCallback(async () => {
    if (!asParams || !objcopyParams) return;

    const gas = await gasLoader(architectureInfo.target);
    const objcopy = await binutilsLoader("objcopy");

    setOutput([]);
    setData(undefined);
    setElfData(undefined);

    const output = [] as ExecutionOutput[],
      inputData = new TextEncoder().encode(input);
    let elf: Uint8Array | undefined = undefined;
    await gas({
      print: (str) =>
        output.push({ program: "gnu-as", line: str, fd: "stdout" }),
      printErr: (str) =>
        output.push({ program: "gnu-as", line: str, fd: "stderr" }),
      arguments: [...asParams, "-o", "/tmp/a.out", "/tmp/a.s"],
      preRun: [(m) => m.FS.writeFile("/tmp/a.s", inputData)],
      postRun: [(m) => (elf = m.FS.readFile("/tmp/a.out"))],
    });

    if (!elf) {
      setOutput(output);
      return;
    }
    setElfData(elf);

    await objcopy({
      print: (str) =>
        output.push({ program: "objcopy", line: str, fd: "stdout" }),
      printErr: (str) =>
        output.push({ program: "objcopy", line: str, fd: "stderr" }),
      arguments: [...objcopyParams, "-Obinary", "/tmp/a.out", "/tmp/a.bin"],
      preRun: [(m) => m.FS.writeFile("/tmp/a.out", elf!)],
      postRun: [(m) => setData(m.FS.readFile("/tmp/a.bin"))],
    });
    setOutput(output);
  }, [asParams, objcopyParams, input, architectureInfo]);
  useEffect(() => {
    assemble().catch((e) =>
      setOutput([{ program: "internal", line: e, fd: "stderr" }]),
    );
  }, [assemble]);

  return (
    <>
      <Stack h="100%" gap={0} {...props}>
        <Grid justify="space-between" align="center" mb="xs" pt={2}>
          <Grid.Col span="content">
            <Group px="md" align="flex-end">
              <Select
                label="Architecture"
                leftSection={
                  <IconCrane
                    style={{ width: rem(16), height: rem(16) }}
                    stroke={1.5}
                  />
                }
                value={architecture}
                data={Object.keys(assemblers)}
                onChange={(value) =>
                  value && setArchitecture(value as keyof typeof assemblers)
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
                    <Code>as</Code> parameters
                  </>
                }
                value={asParamString}
                error={asParams === undefined}
                onChange={(e) => setAsParamString(e.currentTarget.value)}
                leftSection={
                  <IconAssembly
                    style={{ width: rem(16), height: rem(16) }}
                    stroke={1.5}
                  />
                }
                size="xs"
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
              />
              <TextInput
                label={
                  <>
                    <Code>objcopy</Code> parameters
                  </>
                }
                value={objcopyParamString}
                error={objcopyParams === undefined}
                onChange={(e) => setObjcopyParamString(e.currentTarget.value)}
                leftSection={
                  <IconCopyMinus
                    style={{ width: rem(16), height: rem(16) }}
                    stroke={1.5}
                  />
                }
                size="xs"
                styles={{
                  input: {
                    fontFamily: "monospace",
                  },
                }}
              />
            </Group>
          </Grid.Col>
          <Grid.Col span="content">
            <Flex px="md" pt="md" align="flex-end" gap="md">
              <CopyingButton
                value={hexData}
                label="Copy"
                copiedLabel="Copied"
                size="xs"
                variant="outline"
              />
              <DownloadButton
                leftSection={
                  <IconDownload style={{ width: rem(16), height: rem(16) }} />
                }
                variant="outline"
                size="xs"
                filename={`${architectureInfo.target}-[hash].bin`}
                data={data}
              >
                Download Binary
              </DownloadButton>
              <DownloadButton
                leftSection={
                  <IconDownload style={{ width: rem(16), height: rem(16) }} />
                }
                variant="outline"
                size="xs"
                filename={`${architectureInfo.target}-[hash].out`}
                data={elfData}
              >
                Download ELF File
              </DownloadButton>
            </Flex>
          </Grid.Col>
        </Grid>
        <SimpleGrid h="100%" cols={2} ref={containerRef} spacing="xs">
          <CodeMirrorEditor
            value={input}
            height={`${dimensions.height}px`}
            placeholder={
              "Enter your assembly code here...\n" +
              `Targeting: ${architectureInfo.target} ${asParamString}`
            }
            editable={asParams !== undefined && objcopyParams !== undefined}
            onChange={setInput}
            lang="gas"
          />
          <Stack h={dimensions.height}>
            <Collapse in={!!output.length}>
              <ExecutionOutputGroup output={output} />
            </Collapse>
            <Collapse in={!!data?.length}>
              <Code block>{hexData}</Code>
            </Collapse>
            <Collapse in={!output.length && !data?.length}>
              <Alert
                color="gray"
                title="No output yet"
                icon={<IconInfoCircle />}
              >
                No assembly output yet. Write some code and see what happens!
              </Alert>
            </Collapse>
          </Stack>
        </SimpleGrid>
      </Stack>
    </>
  );
}
