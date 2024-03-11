import { useMemo, useState } from "react";

import { Button, ButtonProps, CopyButton, Menu, rem } from "@mantine/core";
import {
  IconBrandPython,
  IconCheck,
  IconCopy,
  IconHash,
  IconSquareRoundedLetterC,
} from "@tabler/icons-react";

const bufferCopyModes = [
  {
    value: "hex-spaced",
    label: "Hex spaced",
    icon: IconHash,
    formatter: (data: number[]) =>
      data
        .map(
          (byte, index) =>
            byte.toString(16).padStart(2, "0") +
            ((index + 1) % 16 === 0 ? "\n" : " "),
        )
        .join("")
        .trim(),
  },
  {
    value: "hex",
    label: "Hex",
    icon: IconHash,
    formatter: (data: number[]) =>
      data.map((byte) => byte.toString(16).padStart(2, "0")).join(""),
  },
  {
    value: "python-bytes",
    label: "Python bytes",
    icon: IconBrandPython,
    formatter: (data: number[]) =>
      `b"${data
        .map((byte) => "\\x" + byte.toString(16).padStart(2, "0"))
        .join("")}"`,
  },
  {
    value: "python-array",
    label: "Python array",
    icon: IconBrandPython,
    formatter: (data: number[]) => `bytearray([${data.join(", ")}])`,
  },
  {
    value: "c-array",
    label: "C array",
    icon: IconSquareRoundedLetterC,
    formatter: (data: number[]) =>
      `unsigned char data[] = {${data.map((byte) => "0x" + byte.toString(16).padStart(2, "0")).join(", ")}};`,
  },
] as const;

type BufferCopyMode = (typeof bufferCopyModes)[number]["value"];

export default function BufferCopyingButton({
  value,
  color,
  copiedLabel,
  ...props
}: ButtonProps & {
  value?: Uint8Array;
  copiedLabel?: React.ReactNode;
  label?: React.ReactNode;
}) {
  props.leftSection ??= (
    <IconCopy style={{ width: rem(16), height: rem(16) }} />
  );

  const [mode, setMode] = useState<BufferCopyMode>("python-bytes");
  const modeLabel = useMemo(
    () => bufferCopyModes.find((m) => m.value === mode)?.label,
    [mode],
  );
  const modeCopyValue = useMemo(
    () =>
      value && value.length > 0
        ? bufferCopyModes.find((m) => m.value === mode)!.formatter([...value])
        : undefined,
    [value, mode],
  );

  props.disabled ||= !modeCopyValue;
  copiedLabel ??= `Copied as ${modeLabel}`;

  return (
    <CopyButton value={modeCopyValue!}>
      {({ copied, copy }) => (
        <Menu trigger="hover">
          <Menu.Target>
            <Button
              color={color || (copied ? "teal" : "blue")}
              onClick={copy}
              {...props}
            >
              {copied ? copiedLabel : `Copy as ${modeLabel}`}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {bufferCopyModes.map(({ icon: ModeIcon, ...m }) => (
              <Menu.Item
                key={m.value}
                leftSection={
                  m.value === mode ? (
                    <IconCheck style={{ width: rem(16), height: rem(16) }} />
                  ) : (
                    <ModeIcon style={{ width: rem(16), height: rem(16) }} />
                  )
                }
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      )}
    </CopyButton>
  );
}
