import { StaticSurface } from '@/components/ui/Surface';
import { CharacterOwnershipContext } from '@/contexts';
import { Select, Stack, Text } from '@mantine/core';
import { useContext } from 'react';

interface StarLevelOption {
  value: string;
  label: string;
}

interface CharacterProgressPanelProps {
  starLevelOptions: StarLevelOption[];
  value: string;
  onChange: (value: string | null) => void;
}

export default function CharacterProgressPanel({
  starLevelOptions,
  value,
  onChange,
}: CharacterProgressPanelProps) {
  const { characterTrackingEnabled } = useContext(CharacterOwnershipContext);

  if (!characterTrackingEnabled || starLevelOptions.length <= 1) {
    return null;
  }

  return (
    <StaticSurface p="md" radius="lg">
      <Stack gap="sm">
        <Text fw={600} size="sm">
          My Progress
        </Text>
        <Select
          label="Star Level"
          description="Track your owned star level for this character."
          data={starLevelOptions}
          value={value}
          onChange={onChange}
          comboboxProps={{ withinPortal: false }}
          size="sm"
        />
      </Stack>
    </StaticSurface>
  );
}
