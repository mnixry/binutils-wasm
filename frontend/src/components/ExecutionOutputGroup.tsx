import { Alert, type AlertProps, Badge, Code, Group } from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";

export interface ExecutionOutput {
  program: string;
  line: string;
  fd: "stdout" | "stderr";
}

export default function ExecutionOutputGroup({
  output,
  title = "Execution output",
  color = "yellow",
  ...props
}: AlertProps & {
  output: ExecutionOutput[];
}) {
  return (
    <Alert color={color} title={title} icon={<IconFileText />} {...props}>
      {output.map((line, index) => (
        <Group pt={2} key={index}>
          <Badge color={line.fd === "stderr" ? "yellow" : "blue"}>
            {line.program}
          </Badge>
          <Code>{line.line}</Code>
        </Group>
      ))}
    </Alert>
  );
}
