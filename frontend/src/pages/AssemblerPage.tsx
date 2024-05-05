import { useCallback, useEffect, useMemo, useState } from "react";

import binutilsLoader from "@binutils-wasm/binutils";
import gasLoader from "@binutils-wasm/gas";
import {
  Alert,
  Code,
  Collapse,
  Flex,
  Grid,
  Group,
  LoadingOverlay,
  Select,
  SimpleGrid,
  Stack,
  type StackProps,
  TextInput,
  rem,
} from "@mantine/core";
import {
  useDebouncedState,
  useDisclosure,
  useResizeObserver,
} from "@mantine/hooks";
import {
  IconAssembly,
  IconCopyMinus,
  IconCrane,
  IconDownload,
  IconInfoCircle,
} from "@tabler/icons-react";

import BufferCopyingButton from "../components/BufferCopyingButton";
import CodeMirrorEditor from "../components/CodeMirrorEditor";
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
import {
  ASSEMBLERS_MAP,
  ASSEMBLE_PUBLIC_PREFIX,
  bufferHexify,
  shlex,
} from "../utils";

export default function AssemblerPage(props: StackProps) {
  const [containerRef, dimensions] = useResizeObserver();

  const [architecture, setArchitecture] =
    useState<keyof typeof ASSEMBLERS_MAP>("x86_64");
  const architectureInfo = useMemo(
    () => ASSEMBLERS_MAP[architecture],
    [architecture],
  );
  useEffect(() => {
    if (architectureInfo.acceptEndianness)
      setEndianness(architectureInfo.acceptEndianness);
    if (architectureInfo.acceptBits)
      setProcessorBits(architectureInfo.acceptBits);
    setInput(
      ASSEMBLE_PUBLIC_PREFIX.join("\n") +
        "\n\t" +
        (architectureInfo.asmPrefix?.join("\n\t") ?? "") +
        "\n\t",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const asParams = useMemo(() => shlex.split(asParamString), [asParamString]);
  const [objcopyParamString, setObjcopyParamString] = useState("-j .shellcode");
  const objcopyParams = useMemo(
    () => shlex.split(objcopyParamString),
    [objcopyParamString],
  );

  const [input, setInput] = useDebouncedState("", 200);
  const [output, setOutput] = useState<ExecutionOutput[]>([]);
  const [data, setData] = useState<Uint8Array>();
  const hexData = useMemo(
    () => (data?.length ? bufferHexify(data, true) : undefined),
    [data],
  );

  const [elfData, setElfData] = useState<Uint8Array>();
  const [loading, { open: startLoading, close: stopLoading }] =
    useDisclosure(false);

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
    startLoading();
    assemble()
      .catch((e) => setOutput([{ program: "internal", line: e, fd: "stderr" }]))
      .finally(stopLoading);
  }, [assemble, startLoading, stopLoading]);

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
                data={Object.keys(ASSEMBLERS_MAP)}
                onChange={(value) =>
                  value && setArchitecture(value as keyof typeof ASSEMBLERS_MAP)
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
              <BufferCopyingButton value={data} size="xs" variant="outline" />
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
          <Stack h={dimensions.height} pos="relative">
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
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
            />
          </Stack>
        </SimpleGrid>
      </Stack>
    </>
  );
}
