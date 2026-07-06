import { readStoredJson, writeStoredJson } from '@/utils/saved-storage';
import { useCallback, useEffect, useState } from 'react';
import { addDaysIso } from '../utils/daily-answer';
import type { DtdleStats } from '../types';

function isValidStats(value: unknown): value is DtdleStats {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Partial<DtdleStats>;
  return (
    typeof v.currentStreak === 'number' &&
    typeof v.maxStreak === 'number' &&
    typeof v.gamesPlayed === 'number' &&
    (v.lastPlayedDate === null || typeof v.lastPlayedDate === 'string')
  );
}

const DEFAULT_STATS: DtdleStats = {
  currentStreak: 0,
  maxStreak: 0,
  gamesPlayed: 0,
  lastPlayedDate: null,
};

/** Shared win-streak tracking, persisted under `storageKey`. A "day" is `todayStr`. */
export function useDailyStats(storageKey: string, todayStr: string) {
  const [stats, setStats] = useState<DtdleStats>(() =>
    readStoredJson(storageKey, DEFAULT_STATS, isValidStats)
  );

  useEffect(() => {
    writeStoredJson(storageKey, stats);
  }, [storageKey, stats]);

  const recordWin = useCallback(() => {
    setStats((prev) => {
      const isConsecutive = prev.lastPlayedDate === addDaysIso(todayStr, -1);
      const currentStreak = isConsecutive ? prev.currentStreak + 1 : 1;
      return {
        currentStreak,
        maxStreak: Math.max(prev.maxStreak, currentStreak),
        gamesPlayed: prev.gamesPlayed + 1,
        lastPlayedDate: todayStr,
      };
    });
  }, [todayStr]);

  return { stats, recordWin };
}
