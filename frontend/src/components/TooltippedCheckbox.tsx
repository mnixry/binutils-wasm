import { Checkbox, CheckboxProps, Tooltip } from "@mantine/core";

export default function TooltippedCheckbox({
  tooltip,
  ...props
}: CheckboxProps & { tooltip: string }) {
  return (
    <Tooltip label={tooltip} refProp="rootRef">
      <Checkbox {...props} />
    </Tooltip>
  );
}
