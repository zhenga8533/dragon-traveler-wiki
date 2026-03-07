import { Group, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import { useIsMobile } from '../../hooks';
import {
  FilterChipGroup,
  FilterClearButton,
  FilterSearchInput,
  FilterSection,
  type FilterChipOption,
} from './FilterControls';

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
  const isMobile = useIsMobile();
  const hasChipFilters = Object.values(selected).some((v) => v.length > 0);
  const hasSearch = search !== undefined && search !== '';
  const hasFilters = hasChipFilters || hasSearch;

  return (
    <Stack gap={8}>
      {onSearchChange !== undefined && (
        <Group gap="xs" align="center" wrap="wrap">
          <FilterSearchInput
            placeholder={searchPlaceholder}
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            size={isMobile ? 'md' : 'xs'}
            style={{ flex: 1, minWidth: 180 }}
          />
          {hasFilters && (
            <FilterClearButton
              size={isMobile ? 'md' : 'compact-xs'}
              onClick={onClear}
            />
          )}
        </Group>
      )}

      {onSearchChange === undefined && hasFilters && (
        <Group justify="flex-end">
          <FilterClearButton
            size={isMobile ? 'md' : 'compact-xs'}
            onClick={onClear}
          />
        </Group>
      )}

      {groups.map((group) => (
        <FilterSection key={group.key} label={group.label}>
          <FilterChipGroup
            value={selected[group.key] ?? []}
            onChange={(val) => onChange(group.key, val)}
            size={isMobile ? 'md' : 'xs'}
            options={group.options.map(
              (option): FilterChipOption => ({
                value: option,
                label: (
                  <Group gap={4} wrap="nowrap" align="center">
                    {group.icon?.(option)}
                    <span>{option}</span>
                  </Group>
                ),
              })
            )}
          />
        </FilterSection>
      ))}
    </Stack>
  );
}
