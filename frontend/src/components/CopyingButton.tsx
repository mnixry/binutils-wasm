import { Button, type ButtonProps, CopyButton, rem } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";

export default function CopyingButton({
  value,
  color,
  copiedLabel,
  label,
  ...props
}: ButtonProps & {
  value?: string;
  copiedLabel?: React.ReactNode;
  label?: React.ReactNode;
}) {
  props.disabled ||= !value;
  label ??= props.children;
  copiedLabel ??= label;

  props.leftSection ??= (
    <IconCopy style={{ width: rem(16), height: rem(16) }} />
  );

  return (
    <CopyButton value={value!}>
      {({ copied, copy }) => (
        <Button
          color={color || (copied ? "teal" : "blue")}
          onClick={copy}
          {...props}
        >
          {copied ? copiedLabel : label}
        </Button>
      )}
    </CopyButton>
  );
}
