import { Paper, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import type { ViewMode } from '../../hooks/use-filters';
import NoResultsSuggestions from '../common/NoResultsSuggestions';
import PaginationControl from '../common/PaginationControl';
import FilterToolbar from './FilterToolbar';

interface FilteredListShellProps {
  count: number;
  noun: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCount: number;
  filterOpen: boolean;
  onFilterToggle: () => void;
  onResetFilters?: () => void;
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
  onResetFilters,
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
    <Paper p="md" radius="md" withBorder data-no-hover>
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
          <NoResultsSuggestions
            title={`No ${noun}s found`}
            message={emptyMessage ?? defaultEmpty}
            onReset={onResetFilters}
            onOpenFilters={onFilterToggle}
          />
        ) : viewMode === 'grid' ? (
          gridContent
        ) : (
          tableContent
        )}

        {page !== undefined && totalPages !== undefined && onPageChange && (
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            onChange={onPageChange}
          />
        )}
      </Stack>
    </Paper>
  );
}
