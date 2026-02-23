import { Paper, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import type { ViewMode } from '../hooks/use-filters';
import FilterToolbar from './FilterToolbar';
import PaginationControl from './PaginationControl';

interface FilteredListShellProps {
  count: number;
  noun: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCount: number;
  filterOpen: boolean;
  onFilterToggle: () => void;
  filterContent: ReactNode;
  emptyMessage?: string;
  gridContent: ReactNode;
  tableContent: ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function FilteredListShell({
  count,
  noun,
  viewMode,
  onViewModeChange,
  filterCount,
  filterOpen,
  onFilterToggle,
  filterContent,
  emptyMessage,
  gridContent,
  tableContent,
  page,
  totalPages,
  onPageChange,
}: FilteredListShellProps) {
  const defaultEmpty = `No ${noun}s match the current filters.`;

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <FilterToolbar
          count={count}
          noun={noun}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          filterCount={filterCount}
          filterOpen={filterOpen}
          onFilterToggle={onFilterToggle}
        >
          {filterContent}
        </FilterToolbar>

        {count === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="md">
            {emptyMessage ?? defaultEmpty}
          </Text>
        ) : viewMode === 'grid' ? (
          gridContent
        ) : (
          tableContent
        )}

        {page !== undefined && totalPages !== undefined && onPageChange && (
          <PaginationControl currentPage={page} totalPages={totalPages} onChange={onPageChange} />
        )}
      </Stack>
    </Paper>
  );
}
