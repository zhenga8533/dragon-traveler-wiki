import { readStoredJson, writeStoredJson } from '@/utils/saved-storage';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (state.date !== todayStr) {
      setState(freshState(todayStr));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  useEffect(() => {
    writeStoredJson(storageKey, state);
  }, [storageKey, state]);

  return [state, setState] as const;
}
