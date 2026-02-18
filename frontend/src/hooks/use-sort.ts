import { useCallback, useEffect, useState } from 'react';

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
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SortState;
        if (
          (parsed.col === null || typeof parsed.col === 'string') &&
          (parsed.dir === 'asc' || parsed.dir === 'desc')
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_SORT;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(sortState));
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
