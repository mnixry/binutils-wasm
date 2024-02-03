import { useEffect, useMemo, useRef, useState } from "react";

import CodeMirror, { keymap } from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import gasLoader from "@binutils-wasm/gas";
import binutilsLoader from "@binutils-wasm/binutils";

import {
  Alert,
  Badge,
  Button,
  Code,
  Flex,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
  rem,
  useComputedColorScheme,
} from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import {
  IconCpu,
  IconAssembly,
  IconCopy,
  IconCopyMinus,
  IconDownload,
  IconCrane,
  IconSortAscending2,
  IconFileText,
  IconInfoCircle,
} from "@tabler/icons-react";
import * as shlex from "shlex";

const publicPrefix = [
  '.section .shellcode,"awx"',
  ".global _start",
  ".global __start",
  "",
  "_start:",
  "__start:",
];

type SupportedTargets = Parameters<typeof gasLoader>[0];

const endianness = ["big", "little"] as const;
type Endianness = (typeof endianness)[number];

const processorBits = [32, 64] as const;
type ProcessorBits = (typeof processorBits)[number];

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

interface ExecuteOutput {
  program: string;
  line: string;
  fd: "stdout" | "stderr";
}

export default function AssemblerPane() {
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const [containerRef, dimensions] = useResizeObserver();

  const [architecture, setArchitecture] =
    useState<keyof typeof assemblers>("x86_64");
  const architectureInfo = useMemo(
    () => assemblers[architecture],
    [architecture]
  );
  useEffect(() => {
    if (architectureInfo.acceptEndianness)
      setEndianness(architectureInfo.acceptEndianness);
    if (architectureInfo.acceptBits)
      setProcessorBits(architectureInfo.acceptBits);
    setInput(
      publicPrefix.join("\n") +
        "\n\t" +
        (architectureInfo.asmPrefix?.join("\n\t") ?? "")
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
    [objcopyParamString]
  );

  const [input, setInput] = useState("");
  const [output, setOutput] = useState<ExecuteOutput[]>([]);
  const [data, setData] = useState<Uint8Array>();
  const hexData = useMemo(
    () =>
      data?.length
        ? [...data]
            .map(
              (byte, index) =>
                byte.toString(16).padStart(2, "0") +
                ((index + 1) % 16 === 0 ? "\n" : " ")
            )
            .join("")
        : undefined,
    [data]
  );

  const [elfData, setElfData] = useState<Uint8Array>();
  const colorScheme = useComputedColorScheme("dark");

  const assemble = async (inputOverride?: string) => {
    if (!asParams || !objcopyParams) return;

    const gas = await gasLoader(architectureInfo.target);
    const objcopy = await binutilsLoader("objcopy");

    setOutput([]);
    setData(undefined);
    setElfData(undefined);

    const output = [] as ExecuteOutput[],
      inputData = new TextEncoder().encode(inputOverride ?? input);
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
  };

  return (
    <>
      <Stack h="100%">
        <Grid justify="space-between" align="center">
          <Grid.Col span="content">
            <Group px="md" mt="xs" align="flex-end">
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
              />
              {architectureInfo.acceptEndianness && (
                <Select
                  label="Endianness"
                  leftSection={
                    <IconSortAscending2
                      style={{ width: rem(16), height: rem(16) }}
                      stroke={1.5}
                    />
                  }
                  value={selectedEndianness}
                  data={endianness}
                  onChange={(value) =>
                    value && setEndianness(value as Endianness)
                  }
                  size="xs"
                />
              )}
              {architectureInfo.acceptBits && (
                <Select
                  label="Processor Bits"
                  leftSection={
                    <IconCpu
                      style={{ width: rem(16), height: rem(16) }}
                      stroke={1.5}
                    />
                  }
                  value={`${selectedProcessorBits}` as const}
                  data={processorBits.map((b) => `${b}`)}
                  onChange={(value) =>
                    value && setProcessorBits(+value as ProcessorBits)
                  }
                  size="xs"
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
              />
            </Group>
          </Grid.Col>
          <Grid.Col span="content">
            <Flex px="md" pt="md" align="flex-end" gap="md">
              <Button
                disabled={!hexData}
                leftSection={
                  <IconCopy style={{ width: rem(16), height: rem(16) }} />
                }
                onClick={() => navigator.clipboard.writeText(hexData!)}
                variant="outline"
                size="xs"
              >
                Copy
              </Button>
              <Button
                disabled={!data?.length}
                leftSection={
                  <IconDownload style={{ width: rem(16), height: rem(16) }} />
                }
                onClick={() => {
                  const blob = new Blob([data!], {
                    type: "application/octet-stream",
                  });
                  const url = URL.createObjectURL(blob);
                  const random = Math.random().toString(36).substring(7);
                  const a = downloadLinkRef.current!;
                  a.href = url;
                  a.download = `${architectureInfo.target}-${random}.bin`;
                  a.click();

                  URL.revokeObjectURL(url);
                }}
                variant="outline"
                size="xs"
              >
                Download Binary
              </Button>
              <Button
                disabled={!elfData?.length}
                leftSection={
                  <IconDownload style={{ width: rem(16), height: rem(16) }} />
                }
                onClick={() => {
                  const blob = new Blob([elfData!], {
                    type: "application/octet-stream",
                  });
                  const url = URL.createObjectURL(blob);
                  const random = Math.random().toString(36).substring(7);
                  const a = downloadLinkRef.current!;
                  a.href = url;
                  a.download = `${architectureInfo.target}-${random}.out`;
                  a.click();

                  URL.revokeObjectURL(url);
                }}
                variant="outline"
                size="xs"
              >
                Download ELF File
              </Button>
              <a ref={downloadLinkRef} href="#" download="a.out" hidden />
            </Flex>
          </Grid.Col>
        </Grid>
        <SimpleGrid h="100%" cols={2} ref={containerRef} spacing="xs">
          <CodeMirror
            value={input}
            height={`${dimensions.height}px`}
            placeholder={
              "Enter your assembly code here...\n" +
              `Targeting: ${architectureInfo.target} ${asParamString}`
            }
            editable={asParams !== undefined && objcopyParams !== undefined}
            onChange={(input) => (assemble(input), setInput(input))}
            extensions={[langs.gas(), keymap.of(vscodeKeymap)]}
            theme={colorScheme === "dark" ? githubDark : githubLight}
          />
          <Stack h={dimensions.height}>
            {!!output.length && (
              <Alert
                color="yellow"
                title="Execution output"
                icon={<IconFileText />}
              >
                {output.map((line, index) => (
                  <Group pt={2} key={index}>
                    <Badge color={line.fd === "stderr" ? "yellow" : "blue"}>
                      {line.program}
                    </Badge>
                    <Code>{line.line}</Code>
                  </Group>
                ))}
              </Alert>
            )}
            {!!data?.length && <Code block>{hexData}</Code>}
            {!output.length && !data?.length && (
              <Alert
                color="gray"
                title="No output yet"
                icon={<IconInfoCircle />}
              >
                No assembly output yet. Write some code and see what happens!
              </Alert>
            )}
          </Stack>
        </SimpleGrid>
      </Stack>
    </>
  );
}
