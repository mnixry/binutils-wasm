import { Center, rem } from "@mantine/core";
import {
  IconArrowAutofitLeft,
  IconArrowAutofitRight,
} from "@tabler/icons-react";

import TitledSegmentControl from "./TitledSegmentedControl";

const endianness = ["big", "little"] as const;
export type Endianness = (typeof endianness)[number];

export default function EndiannessSegmentedControl({
  value,
  onChange,
}: {
  value: Endianness;
  onChange: (value: Endianness) => void;
}) {
  return (
    <TitledSegmentControl
      label="Endianness"
      data={[
        {
          value: "big",
          label: (
            <Center style={{ gap: 10 }}>
              <IconArrowAutofitLeft
                style={{ width: rem(16), height: rem(16) }}
              />
              <span>Big</span>
            </Center>
          ),
        },
        {
          value: "little",
          label: (
            <Center style={{ gap: 10 }}>
              <IconArrowAutofitRight
                style={{ width: rem(16), height: rem(16) }}
              />
              <span>Little</span>
            </Center>
          ),
        },
      ]}
      value={value}
      onChange={(value) => onChange(value as Endianness)}
      size="xs"
    />
  );
}
