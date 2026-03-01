import { useMemo, useRef } from 'react';
import {
  countActiveFilters,
  useFilterPanel,
  useFilters,
  useViewMode,
} from './use-filters';
import type { ViewMode } from './use-filters';
import { usePagination } from './use-pagination';
import { useSortState } from './use-sort';

const DEFAULT_PAGE_SIZE = 50;

export function useFilteredPageData<T, F extends object>(
  data: T[],
  options: {
    emptyFilters: F;
    filterFn: (item: T, filters: F) => boolean;
    sortFn: (a: T, b: T, col: string | null, dir: 'asc' | 'desc') => number;
    storageKeys?: { filters?: string; viewMode?: string; sort?: string };
    defaultViewMode?: ViewMode;
    pageSize?: number;
  }
) {
  const {
    emptyFilters,
    filterFn,
    sortFn,
    storageKeys = {},
    defaultViewMode = 'grid',
    pageSize = DEFAULT_PAGE_SIZE,
  } = options;

  const filterFnRef = useRef(filterFn);
  filterFnRef.current = filterFn;
  const sortFnRef = useRef(sortFn);
  sortFnRef.current = sortFn;

  const { filters, setFilters, resetFilters, updateFilter } = useFilters<F>({
    emptyFilters,
    storageKey: storageKeys.filters,
  });

  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();

  const [viewMode, setViewMode] = useViewMode({
    storageKey: storageKeys.viewMode ?? '',
    defaultMode: defaultViewMode,
  });

  const { sortState, handleSort } = useSortState(storageKeys.sort ?? '');
  const { col: sortCol, dir: sortDir } = sortState;

  const filtered = useMemo(
    () =>
      data
        .filter((item) => filterFnRef.current(item, filters))
        .sort((a, b) => sortFnRef.current(a, b, sortCol, sortDir)),
    [data, filters, sortCol, sortDir]
  );

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    pageSize,
    JSON.stringify(filters)
  );

  const pageItems = filtered.slice(offset, offset + pageSize);

  const activeFilterCount = countActiveFilters(filters);

  return {
    // Filter state
    filters,
    setFilters,
    resetFilters,
    updateFilter,
    // Panel state
    filterOpen,
    toggleFilter,
    // View mode
    viewMode,
    setViewMode,
    // Sort state
    sortState,
    handleSort,
    // Data
    filtered,
    pageItems,
    // Pagination
    page,
    setPage,
    totalPages,
    // Derived
    activeFilterCount,
  };
}
