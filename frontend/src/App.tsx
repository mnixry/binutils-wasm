import { useState } from "react";
import loader from "@binutils-wasm/binutils";

import "@mantine/core/styles.css";

import {
  Button,
  Card,
  Code,
  MantineProvider,
  Text,
  Title,
} from "@mantine/core";

function App() {
  const [output, setOutput] = useState("");

  return (
    <>
      <MantineProvider>
        <Title order={1}>Vite + React</Title>
        <Card>
          <Button
            onClick={async () => {
              const objdump = await loader("objdump");
              let output = "";
              await objdump({
                print: (line) => {
                  output += `[out] ${line}\n`
                },
                printErr: (line) => {
                  output += `[err] ${line}\n`
                },
                arguments: ['--version']
              });
              setOutput(output);
            }}
          >
            Run
          </Button>
          <Text>
            <Code block>{output}</Code>
          </Text>
        </Card>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </MantineProvider>
    </>
  );
}

export default App;
