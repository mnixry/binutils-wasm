import {
  SegmentedControl,
  type SegmentedControlProps,
  Stack,
  Text,
} from "@mantine/core";

export default function TitledSegmentControl({
  label,
  ...props
}: SegmentedControlProps & { label: React.ReactNode }) {
  return (
    <Stack gap={0}>
      <Text size="xs" fw={500} mt={3}>
        {label}
      </Text>
      <SegmentedControl {...props} />
    </Stack>
  );
}
