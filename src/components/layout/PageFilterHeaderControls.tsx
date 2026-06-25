import ViewToggle from '@/components/ui/ViewToggle';
import { Z_INDEX } from '@/constants/ui';
import type { ViewMode } from '@/hooks/use-filters';
import { Box, Group } from '@mantine/core';
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
  sticky?: boolean;
}

export default function PageFilterHeaderControls({
  viewMode,
  onViewModeChange,
  filterCount,
  filterOpen = false,
  onFilterToggle,
  buttonLabel = 'Filters',
  children,
  sticky = false,
}: PageFilterHeaderControlsProps) {
  return (
    <Box
      style={
        sticky
          ? {
              position: 'sticky',
              top: 'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-xs))',
              zIndex: Z_INDEX.STICKY,
              padding: 'var(--mantine-spacing-xs)',
              borderRadius: 'var(--mantine-radius-md)',
              background: 'var(--mantine-color-body)',
              border: '1px solid var(--mantine-color-default-border)',
            }
          : undefined
      }
    >
      <Group gap="xs" justify={sticky ? 'flex-end' : undefined}>
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
    </Box>
  );
}
