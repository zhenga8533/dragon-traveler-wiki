import { Group, SegmentedControl, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import {
  FilterClearButton,
  FilterSearchInput,
  FilterSection,
} from '@/components/common/FilterControls';
import type { GradientPaletteAccents } from '@/contexts';
import type { UsageQualityFilter } from '@/features/wiki/usage/entity-usage';

interface UsageFilterControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filterCount: number;
  onReset: () => void;
  qualityFilter: UsageQualityFilter;
  onQualityFilterChange: (value: UsageQualityFilter) => void;
  qualityOptions: { value: UsageQualityFilter; label: string }[];
  accent: GradientPaletteAccents;
  children?: ReactNode;
}

export default function UsageFilterControls({
  search,
  onSearchChange,
  searchPlaceholder,
  filterCount,
  onReset,
  qualityFilter,
  onQualityFilterChange,
  qualityOptions,
  accent,
  children,
}: UsageFilterControlsProps) {
  return (
    <Stack gap={8}>
      <Group gap="xs" align="center" wrap="wrap">
        <FilterSearchInput
          placeholder={searchPlaceholder}
          value={search}
          onSearch={onSearchChange}
          size="xs"
          style={{ flex: 1, minWidth: 220 }}
        />
        {filterCount > 0 && (
          <FilterClearButton size="compact-xs" onClick={onReset} />
        )}
      </Group>
      <FilterSection label="Character quality">
        <SegmentedControl
          value={qualityFilter}
          onChange={(value) =>
            onQualityFilterChange(value as UsageQualityFilter)
          }
          data={qualityOptions}
          color={accent.primary}
          size="xs"
        />
      </FilterSection>
      {children}
    </Stack>
  );
}
