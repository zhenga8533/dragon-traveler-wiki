import { Button, Chip, Group, Stack, Text, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { useContext } from 'react';
import { IoClose, IoSearch } from 'react-icons/io5';
import { BREAKPOINTS, IMAGE_SIZE } from '../../constants/ui';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';

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
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
  const searchIconColor = `var(--mantine-color-${accent.primary}-6)`;
  const hasChipFilters = Object.values(selected).some((v) => v.length > 0);
  const hasSearch = search !== undefined && search !== '';
  const hasFilters = hasChipFilters || hasSearch;

  return (
    <Stack gap={8}>
      {onSearchChange !== undefined && (
        <Group gap="xs" align="center" wrap="wrap">
          <TextInput
            placeholder={searchPlaceholder}
            leftSection={
              <IoSearch size={IMAGE_SIZE.ICON_MD} color={searchIconColor} />
            }
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            size={isMobile ? 'md' : 'xs'}
            style={{ flex: 1, minWidth: 180 }}
          />
          {hasFilters && (
            <Button
              variant="subtle"
              color={accent.primary}
              size={isMobile ? 'md' : 'compact-xs'}
              leftSection={<IoClose size={IMAGE_SIZE.ICON_SM} />}
              onClick={onClear}
            >
              Clear
            </Button>
          )}
        </Group>
      )}

      {onSearchChange === undefined && hasFilters && (
        <Group justify="flex-end">
          <Button
            variant="subtle"
            color={accent.primary}
            size={isMobile ? 'md' : 'compact-xs'}
            leftSection={<IoClose size={IMAGE_SIZE.ICON_SM} />}
            onClick={onClear}
          >
            Clear
          </Button>
        </Group>
      )}

      {groups.map((group) => (
        <Group key={group.key} gap="xs" align="center" wrap="wrap">
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            c="dimmed"
            style={{ minWidth: 60 }}
          >
            {group.label}
          </Text>
          <Chip.Group
            multiple
            value={selected[group.key] ?? []}
            onChange={(val) => onChange(group.key, val)}
          >
            <Group gap={4} wrap="wrap">
              {group.options.map((option) => (
                <Chip
                  key={option}
                  value={option}
                  size={isMobile ? 'md' : 'xs'}
                  color={accent.primary}
                >
                  <Group gap={4} wrap="nowrap" align="center">
                    {group.icon?.(option)}
                    <span>{option}</span>
                  </Group>
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Group>
      ))}
    </Stack>
  );
}
