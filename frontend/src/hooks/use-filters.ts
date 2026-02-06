import { useCallback, useEffect, useMemo, useState } from 'react';

export type ViewMode = 'grid' | 'list';

interface UseViewModeOptions {
  storageKey: string;
  defaultMode?: ViewMode;
}

/**
 * Hook to manage view mode (grid/list) with localStorage persistence
 */
export function useViewMode({
  storageKey,
  defaultMode = 'grid',
}: UseViewModeOptions) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') {
      return defaultMode;
    }
    const stored = window.localStorage.getItem(storageKey);
    return stored === 'grid' || stored === 'list' ? stored : defaultMode;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, viewMode);
  }, [storageKey, viewMode]);

  return [viewMode, setViewMode] as const;
}

interface UseFilterPanelOptions {
  defaultOpen?: boolean;
}

/**
 * Hook to manage filter panel open/closed state
 */
export function useFilterPanel({
  defaultOpen = false,
}: UseFilterPanelOptions = {}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, toggle, open, close };
}

interface UseFiltersOptions<T> {
  emptyFilters: T;
}

/**
 * Generic hook for managing filter state
 */
export function useFilters<T>({ emptyFilters }: UseFiltersOptions<T>) {
  const [filters, setFilters] = useState<T>(emptyFilters);

  const resetFilters = useCallback(() => {
    setFilters(emptyFilters);
  }, [emptyFilters]);

  const updateFilter = useCallback((key: keyof T, value: T[keyof T]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { filters, setFilters, resetFilters, updateFilter };
}

interface UseFilteredDataOptions<T, F> {
  data: T[];
  filters: F;
  filterFn: (items: T[], filters: F) => T[];
  sortFn?: (items: T[]) => T[];
}

/**
 * Hook to handle data filtering and sorting
 */
export function useFilteredData<T, F>({
  data,
  filters,
  filterFn,
  sortFn,
}: UseFilteredDataOptions<T, F>) {
  return useMemo(() => {
    const filtered = filterFn(data, filters);
    return sortFn ? sortFn(filtered) : filtered;
  }, [data, filters, filterFn, sortFn]);
}
