import { Grid, Group, SimpleGrid, Stack } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import { useMemo, useState } from "react";
import CodeMirrorEditor from "../components/CodeMirrorEditor";

export default function DisassemblerPage() {
  const [outerGridRef, outerGridDimensions] = useResizeObserver();
  const [innerGroupRef, innerGroupDimensions] = useResizeObserver();
  const innerEditorHeight = useMemo(
    () => outerGridDimensions.height - innerGroupDimensions.height,
    [outerGridDimensions, innerGroupDimensions]
  );

  const [input, setInput] = useState("");
  const [asm, setAsm] = useState("");

  return (
    <>
      <Stack h="100%">
        <Grid>
          <Grid.Col></Grid.Col>
          <Grid.Col></Grid.Col>
        </Grid>
        <SimpleGrid h="100%" cols={2} ref={outerGridRef} spacing="xs">
          <CodeMirrorEditor
            value={input}
            height={`${outerGridDimensions.height}px`}
            onChange={setInput}
          />
          <Stack h={outerGridDimensions.height} gap={0}>
            <Group ref={innerGroupRef}>Hello World</Group>
            <CodeMirrorEditor
              value={asm}
              height={`${innerEditorHeight}px`}
              editable={false}
            />
          </Stack>
        </SimpleGrid>
      </Stack>
    </>
  );
}
