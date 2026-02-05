import { Button, Chip, Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';

export interface ChipFilterGroup {
  key: string;
  label: string;
  options: string[];
  icon?: (value: string) => ReactNode;
}

export interface EntityFilterProps {
  groups: ChipFilterGroup[];
  selected: Record<string, string[]>;
  onChange: (key: string, values: string[]) => void;
  onClear: () => void;
}

export default function EntityFilter({
  groups,
  selected,
  onChange,
  onClear,
}: EntityFilterProps) {
  const hasFilters = Object.values(selected).some((v) => v.length > 0);

  return (
    <Stack gap="sm">
      {hasFilters && (
        <Group justify="flex-end">
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<IoClose size={14} />}
            onClick={onClear}
          >
            Clear all
          </Button>
        </Group>
      )}

      {groups.map((group) => (
        <Stack key={group.key} gap="xs">
          <Text size="xs" fw={500} c="dimmed">{group.label}</Text>
          <Chip.Group
            multiple
            value={selected[group.key] ?? []}
            onChange={(val) => onChange(group.key, val)}
          >
            <Group gap="xs" wrap="wrap">
              {group.options.map((option) => (
                <Chip key={option} value={option} size="xs">
                  <Group gap={4} wrap="nowrap" align="center">
                    {group.icon?.(option)}
                    <span>{option}</span>
                  </Group>
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Stack>
      ))}
    </Stack>
  );
}
