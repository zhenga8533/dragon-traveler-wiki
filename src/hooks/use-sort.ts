import { useCallback, useEffect, useState } from 'react';
import { readStoredJson, writeStoredJson } from '@/utils/saved-storage';

export interface SortState {
  col: string | null;
  dir: 'asc' | 'desc';
}

const DEFAULT_SORT: SortState = { col: null, dir: 'asc' };

/**
 * Manages sortable column state with localStorage persistence.
 * Click cycle: asc → desc → reset (null).
 */
export function useSortState(storageKey: string) {
  const [sortState, setSortState] = useState<SortState>(() => {
    return readStoredJson(
      storageKey,
      DEFAULT_SORT,
      (value): value is SortState => {
        if (value === null || typeof value !== 'object') return false;
        const parsed = value as Partial<SortState>;
        return (
          (parsed.col === null || typeof parsed.col === 'string') &&
          (parsed.dir === 'asc' || parsed.dir === 'desc')
        );
      }
    );
  });

  useEffect(() => {
    writeStoredJson(storageKey, sortState);
  }, [storageKey, sortState]);

  const handleSort = useCallback((key: string) => {
    setSortState((prev) => {
      if (prev.col === key) {
        if (prev.dir === 'asc') return { col: key, dir: 'desc' };
        return DEFAULT_SORT;
      }
      return { col: key, dir: 'asc' };
    });
  }, []);

  return { sortState, handleSort };
}

/** Apply a directional multiplier to a comparator result. */
export function applyDir(cmp: number, dir: 'asc' | 'desc') {
  return dir === 'desc' ? -cmp : cmp;
}
