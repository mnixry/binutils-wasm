import { useCallback, useEffect, useMemo, useState } from "react";

import loader from "@binutils-wasm/binutils";
import {
  ActionIcon,
  Code,
  Collapse,
  FileButton,
  Grid,
  Group,
  LoadingOverlay,
  Select,
  SimpleGrid,
  Space,
  Stack,
  type StackProps,
  TextInput,
  Tooltip,
  rem,
} from "@mantine/core";
import { useDisclosure, useResizeObserver } from "@mantine/hooks";
import {
  IconCopyPlus,
  IconCrane,
  IconDownload,
  IconFolderOpen,
  IconPackageExport,
} from "@tabler/icons-react";

import CodeMirrorEditor from "../components/CodeMirrorEditor";
import CopyingButton from "../components/CopyingButton";
import DownloadButton from "../components/DownloadButton";
import EndiannessSegmentedControl, {
  Endianness,
} from "../components/EndiannessSegmentedControl";
import ExecutionOutputGroup, {
  ExecutionOutput,
} from "../components/ExecutionOutputGroup";
import ProcessorBitsSegmentedControl, {
  ProcessorBits,
} from "../components/ProcessorBitsSegmentedControl";
import TooltippedCheckbox from "../components/TooltippedCheckbox";
import { DISASSEMBLERS_MAP, bufferHexify, shlex } from "../utils";

export default function DisassemblerPage(props: StackProps) {
  const [outerGridRef, outerGridDimensions] = useResizeObserver();
  const [rightGridRef, rightTopDimensions] = useResizeObserver();
  const [leftGridRef, leftDimensions] = useResizeObserver();
  const rightEditorHeight = useMemo(
    () => outerGridDimensions.height - rightTopDimensions.height,
    [outerGridDimensions, rightTopDimensions],
  );
  const leftEditorHeight = useMemo(
    () => outerGridDimensions.height - leftDimensions.height,
    [outerGridDimensions, leftDimensions],
  );

  const [input, setInput] = useState("");
  const [inputBinary, setInputBinary] = useState<Uint8Array>();
  useEffect(
    () => setInput(inputBinary?.length ? bufferHexify(inputBinary, true) : ""),
    [inputBinary],
  );
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
        new Uint8Array(
          formattedInput.split(/\s/g).map((x) => Number.parseInt(x, 16)),
        ),
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
    useState<keyof typeof DISASSEMBLERS_MAP>("x86_64");
  const architectureInfo = useMemo(
    () => DISASSEMBLERS_MAP[architecture],
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
  const [showByte, { toggle: toggleByte }] = useDisclosure(true);
  const [showOffset, { toggle: toggleOffset }] = useDisclosure(true);
  const [showInstruction, { toggle: toggleInstruction }] = useDisclosure(true);
  const [showRawAssembly, { toggle: toggleRawAssembly }] = useDisclosure(false);
  const [showIntelSyntax, { toggle: toggleIntelSyntax }] = useDisclosure(true);
  const [enableAutoFormatting, { toggle: toggleAutoFormatting }] =
    useDisclosure(true);
  useEffect(() => {
    const { bfdArch, bfdNameFactory } = architectureInfo;
    const bfdName = bfdNameFactory({
      e: selectedEndianness,
      b: selectedProcessorBits,
    });

    const objDumpArgs = ["-w", "-d", "--adjust-vma=0", "-b", bfdName];
    if (!showByte) objDumpArgs.push("--no-show-raw-insn");
    if (showIntelSyntax) objDumpArgs.push("-M", "intel");
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
        "-w",
        "-N",
        "*",
      ]),
    );
  }, [
    architectureInfo,
    selectedEndianness,
    selectedProcessorBits,
    showByte,
    showIntelSyntax,
  ]);

  const [objCopyParamString, setObjCopyParamString] = useState("");
  const objCopyParams = useMemo(
    () => shlex.split(objCopyParamString),
    [objCopyParamString],
  );
  const [objDumpParamString, setObjDumpParamString] = useState("");
  const objDumpParams = useMemo(
    () => shlex.split(objDumpParamString),
    [objDumpParamString],
  );
  const [output, setOutput] = useState<ExecutionOutput[]>([]);
  const [loading, { open: startLoading, close: stopLoading }] =
    useDisclosure(false);

  const [asm, setAsm] = useState("");
  const disassemble = useCallback(async () => {
    if (!objDumpParams || !objCopyParams || !inputBinary?.length) return;

    const objdump = await loader("objdump");
    const objcopy = await loader("objcopy");

    const output = [] as ExecutionOutput[];
    const logErr = (line: string) => {
      output.push({ fd: "stderr", program: "internal", line });
      return output;
    };

    let copiedBinary = undefined as Uint8Array | undefined;
    await objcopy({
      arguments: [...objCopyParams, "-I", "binary", "/tmp/a.out", "/tmp/a.bin"],
      print: (line) => output.push({ fd: "stdout", program: "objcopy", line }),
      printErr: (line) =>
        output.push({ fd: "stderr", program: "objcopy", line }),
      preRun: [(m) => m.FS.writeFile("/tmp/a.out", inputBinary)],
      postRun: [
        (m) => {
          try {
            copiedBinary = m.FS.readFile("/tmp/a.bin");
          } catch (e) {
            return logErr(
              `objcopy failed to copy the binary: ${JSON.stringify(e)}`,
            );
          }
        },
      ],
    });
    if (!copiedBinary) return logErr("objcopy failed to copy the binary.");

    let dumpStdout = "";
    await objdump({
      arguments: [...objDumpParams, "/tmp/a.out"],
      print: (line) => (dumpStdout += `${line}\n`),
      printErr: (line) =>
        output.push({ fd: "stderr", program: "objdump", line }),
      preRun: [(m) => m.FS.writeFile("/tmp/a.out", copiedBinary!)],
    });

    const stdoutSplit = dumpStdout.split(/<\.text(?:\+0x0)?>:\n/m);
    if (stdoutSplit.length !== 2)
      return logErr("could not find .text section in objdump output");
    const [, result] = stdoutSplit;

    const lines = result.split("\n").map((line) => {
      const pattern = showByte
        ? /^(?<offset>\s*[0-9a-f]+:\s*)(?<byte>(?:[0-9a-f]+\s)+\s*)?(?<inst>.*)/
        : /^(?<offset>\s*[0-9a-f]+:\s*)(?<inst>.*)/;
      const match = line.match(pattern);
      if (!match) return line;
      const { offset, byte, inst } = match.groups!;

      let fullLine = "";
      if (showOffset) fullLine += offset;
      if (showByte && byte) fullLine += byte;
      if (showInstruction) fullLine += inst;
      return fullLine;
    });
    setAsm(lines.join("\n"));
    return output;
  }, [
    inputBinary,
    objCopyParams,
    objDumpParams,
    showByte,
    showInstruction,
    showOffset,
  ]);
  useEffect(() => {
    startLoading();
    disassemble()
      .then((output) => output && setOutput(output))
      .catch((err) =>
        setOutput([{ fd: "stderr", program: "internal", line: err }]),
      )
      .finally(stopLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disassemble]);

  return (
    <>
      <Stack h="100%" gap={0} {...props}>
        <SimpleGrid h="100%" cols={2} ref={outerGridRef} spacing="xs">
          <Stack h={outerGridDimensions.height} gap={0}>
            <Stack ref={leftGridRef}>
              <Group px="md" pb="sm" pt={2} align="flex-end" gap="sm">
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
                    <Tooltip label="Open binary file">
                      <ActionIcon size="xl" variant="light" {...props}>
                        <IconFolderOpen
                          style={{ width: rem(16), height: rem(16) }}
                        />
                      </ActionIcon>
                    </Tooltip>
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
                  data={Object.keys(DISASSEMBLERS_MAP)}
                  value={architecture}
                  onChange={(value) =>
                    value &&
                    setArchitecture(value as keyof typeof DISASSEMBLERS_MAP)
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
                <SimpleGrid cols={3} spacing="xs">
                  <TooltippedCheckbox
                    tooltip="Include the hex-printed bytes in the disassembly"
                    label="Byte"
                    disabled={showRawAssembly}
                    checked={showByte}
                    onChange={toggleByte}
                    size="xs"
                  />
                  <TooltippedCheckbox
                    tooltip="Include the instruction contents in the disassembly"
                    label="Instructions"
                    disabled={showRawAssembly}
                    checked={showInstruction}
                    onChange={toggleInstruction}
                    size="xs"
                  />
                  <TooltippedCheckbox
                    tooltip="Include the virtual memory address in the disassembly"
                    label="Offset"
                    disabled={showRawAssembly}
                    checked={showOffset}
                    onChange={toggleOffset}
                    size="xs"
                  />
                  <TooltippedCheckbox
                    tooltip="Disassemble the entire ELF file, disable all pre and post processing"
                    label="Dump only"
                    checked={showRawAssembly}
                    onChange={toggleRawAssembly}
                    size="xs"
                  />
                  <TooltippedCheckbox
                    tooltip="Use Intel syntax for disassembly"
                    label="Intel syntax"
                    checked={showIntelSyntax}
                    onChange={toggleIntelSyntax}
                    size="xs"
                  />
                  <TooltippedCheckbox
                    tooltip="Automatically format the input binary hex string"
                    label="Auto format"
                    checked={enableAutoFormatting}
                    onChange={toggleAutoFormatting}
                    size="xs"
                  />
                </SimpleGrid>

                <Grid w={rightTopDimensions.width}>
                  <Grid.Col span={6}>
                    <TextInput
                      label={
                        <>
                          <Code>objcopy</Code> parameters
                        </>
                      }
                      value={objCopyParamString}
                      disabled={showRawAssembly}
                      error={objCopyParams === undefined}
                      styles={{
                        input: {
                          fontFamily: "monospace",
                        },
                      }}
                      onChange={(e) =>
                        setObjCopyParamString(e.currentTarget.value)
                      }
                      leftSection={
                        <IconCopyPlus
                          style={{ width: rem(16), height: rem(16) }}
                          stroke={1.5}
                        />
                      }
                      size="xs"
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
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
                      onChange={(e) =>
                        setObjDumpParamString(e.currentTarget.value)
                      }
                      leftSection={
                        <IconPackageExport
                          style={{ width: rem(16), height: rem(16) }}
                          stroke={1.5}
                        />
                      }
                      size="xs"
                    />
                  </Grid.Col>
                </Grid>
              </Group>
            </Stack>
            <CodeMirrorEditor
              value={input}
              height={`${leftEditorHeight}px`}
              onChange={setInput}
              onBlur={() =>
                formattedInput &&
                enableAutoFormatting &&
                setInput(formattedInput)
              }
            />
          </Stack>
          <Stack h={outerGridDimensions.height} gap={0} pos="relative">
            <Stack ref={rightGridRef}>
              <Group justify="end" pt="md" px="md">
                <CopyingButton
                  value={asm}
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
                  data={asm}
                  filename="objdump-[hash].s"
                  contentType="text/plain"
                  size="xs"
                >
                  Download
                </DownloadButton>
              </Group>
              <Collapse in={output.length > 0}>
                <ExecutionOutputGroup output={output} />
              </Collapse>
              <Space />
            </Stack>
            <CodeMirrorEditor
              height={`${rightEditorHeight}px`}
              value={asm}
              editable={false}
              lang="gas"
            />
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
