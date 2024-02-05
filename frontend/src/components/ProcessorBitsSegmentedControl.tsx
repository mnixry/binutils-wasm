import { useMemo } from "react";

import TitledSegmentControl from "./TitledSegmentedControl";

const processorBits = [8, 16, 32, 64] as const;
export type ProcessorBits = (typeof processorBits)[number];

export default function ProcessorBitsSegmentedControl({
  value,
  onChange,
}: {
  value: ProcessorBits;
  onChange: (value: ProcessorBits) => void;
}) {
  const valueStr = useMemo(() => value.toString(), [value]);
  return (
    <TitledSegmentControl
      label="Processor Bits"
      data={processorBits.map((bits) => `${bits}`)}
      value={valueStr}
      onChange={(value) => onChange(+value as ProcessorBits)}
      styles={{
        label: {
          fontFamily: "monospace",
        },
      }}
      size="xs"
    />
  );
}
