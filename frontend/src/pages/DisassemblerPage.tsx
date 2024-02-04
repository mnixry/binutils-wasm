import { useEffect, useMemo, useState } from "react";

import {
  Button,
  FileButton,
  Grid,
  SimpleGrid,
  Stack,
  rem,
} from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import { IconUpload } from "@tabler/icons-react";

import CodeMirrorEditor from "../components/CodeMirrorEditor";
import ExecutionOutputGroup, {
  ExecutionOutput,
} from "../components/ExecutionOutputGroup";

export default function DisassemblerPage() {
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
  const [output, setOutput] = useState<ExecutionOutput[]>([]);

  return (
    <>
      <Stack h="100%" gap={0}>
        <Grid justify="space-between" align="center" mb="xs">
          <Grid.Col span="content">
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
            />
          </Stack>
        </SimpleGrid>
      </Stack>
    </>
  );
}
