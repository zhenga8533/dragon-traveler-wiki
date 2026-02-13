import { Button, Chip, Divider, Group, Stack, Text, TextInput } from '@mantine/core';
import type { ReactNode } from 'react';
import { IoClose, IoSearch } from 'react-icons/io5';
import { IMAGE_SIZE } from '../constants/ui';

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
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export default function EntityFilter({
  groups,
  selected,
  onChange,
  onClear,
  search,
  onSearchChange,
  searchPlaceholder = 'Search by name...',
}: EntityFilterProps) {
  const hasChipFilters = Object.values(selected).some((v) => v.length > 0);
  const hasSearch = search !== undefined && search !== '';
  const hasFilters = hasChipFilters || hasSearch;

  return (
    <Stack gap="sm">
      {onSearchChange !== undefined && (
        <Group justify="space-between" align="center" wrap="wrap">
          <TextInput
            placeholder={searchPlaceholder}
            leftSection={<IoSearch size={IMAGE_SIZE.ICON_MD} />}
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          {hasFilters && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IoClose size={IMAGE_SIZE.ICON_SM} />}
              onClick={onClear}
            >
              Clear all
            </Button>
          )}
        </Group>
      )}

      {onSearchChange === undefined && hasFilters && (
        <Group justify="flex-end">
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<IoClose size={IMAGE_SIZE.ICON_SM} />}
            onClick={onClear}
          >
            Clear all
          </Button>
        </Group>
      )}

      {groups.map((group, index) => (
        <Stack key={group.key} gap="xs">
          {index > 0 && <Divider />}
          <Text size="xs" fw={600} tt="uppercase" c="dimmed">
            {group.label}
          </Text>
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
