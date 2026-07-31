import { readStoredJson, writeStoredJson } from '@/utils/saved-storage';
import { useEffect, useState } from 'react';
import type { DtdleGameState } from '../types';

export function isValidGameState(value: unknown): value is DtdleGameState {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Partial<DtdleGameState>;
  return (
    typeof v.date === 'string' &&
    Array.isArray(v.guessedSlugs) &&
    v.guessedSlugs.every((s) => typeof s === 'string') &&
    typeof v.solved === 'boolean'
  );
}

export function freshGameState(date: string): DtdleGameState {
  return { date, guessedSlugs: [], solved: false };
}

/**
 * Persists a per-day game state object under `storageKey`, resetting to
 * `freshState(todayStr)` whenever the stored state's `date` doesn't match
 * today (i.e. it's a new day). Shared by every DTdle mode.
 */
export function useDailyGameState<T extends { date: string }>(
  storageKey: string,
  todayStr: string,
  freshState: (date: string) => T,
  isValid: (value: unknown) => value is T
) {
  const [state, setState] = useState<T>(() =>
    readStoredJson(storageKey, freshState(todayStr), isValid)
  );
  if (state.date !== todayStr) {
    setState(freshState(todayStr));
  }

  useEffect(() => {
    writeStoredJson(storageKey, state);
  }, [storageKey, state]);

  return [state, setState] as const;
}
