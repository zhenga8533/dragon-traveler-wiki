import ViewToggle from '@/components/ui/ViewToggle';
import type { ViewMode } from '@/hooks/use-filters';
import { Group } from '@mantine/core';
import { type ReactNode } from 'react';
import FilterPopoverButton from './FilterPopoverButton';

interface PageFilterHeaderControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCount: number;
  filterOpen?: boolean;
  onFilterToggle: () => void;
  buttonLabel?: string;
  children?: ReactNode;
}

export default function PageFilterHeaderControls({
  viewMode,
  onViewModeChange,
  filterCount,
  filterOpen = false,
  onFilterToggle,
  buttonLabel = 'Filters',
  children,
}: PageFilterHeaderControlsProps) {
  return (
    <Group gap="xs">
      <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
      <FilterPopoverButton
        filterCount={filterCount}
        filterOpen={filterOpen}
        onFilterToggle={onFilterToggle}
        buttonLabel={buttonLabel}
      >
        {children}
      </FilterPopoverButton>
    </Group>
  );
}
