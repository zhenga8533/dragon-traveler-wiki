import ViewToggle from '@/components/ui/ViewToggle';
import { HEADER_HEIGHT, Z_INDEX } from '@/constants/ui';
import { useIsMobile } from '@/hooks';
import type { ViewMode } from '@/hooks/use-filters';
import { Box, Group, Text } from '@mantine/core';
import { type ReactNode } from 'react';
import FilterPopoverButton from './FilterPopoverButton';

interface FilterToolbarProps {
  count: number;
  noun: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCount: number;
  filterOpen: boolean;
  onFilterToggle: () => void;
  children: ReactNode;
}

export default function FilterToolbar({
  count,
  noun,
  viewMode,
  onViewModeChange,
  filterCount,
  filterOpen,
  onFilterToggle,
  children,
}: FilterToolbarProps) {
  const isMobile = useIsMobile();

  return (
    <Box
      style={
        isMobile
          ? {
              position: 'sticky',
              top: `calc(${HEADER_HEIGHT.MOBILE}px + var(--mantine-spacing-xs))`,
              zIndex: Z_INDEX.STICKY,
              padding: 'var(--mantine-spacing-xs)',
              borderRadius: 'var(--mantine-radius-md)',
              background: 'var(--mantine-color-body)',
              border: '1px solid var(--mantine-color-default-border)',
            }
          : undefined
      }
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Text size="sm" c="dimmed">
          {count} {noun}
          {count !== 1 ? 's' : ''}
        </Text>
        <Group gap="xs">
          <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
          <FilterPopoverButton
            filterCount={filterCount}
            filterOpen={filterOpen}
            onFilterToggle={onFilterToggle}
          >
            {children}
          </FilterPopoverButton>
        </Group>
      </Group>
    </Box>
  );
}
