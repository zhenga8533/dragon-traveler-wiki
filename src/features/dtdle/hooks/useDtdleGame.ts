import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { readStoredJson, writeStoredJson } from '@/utils/saved-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  addDaysIso,
  getEligibleCharacters,
  getTodayAnswerSlug,
  getTodayIsoDate,
} from '../utils/daily-answer';
import type { DtdleGameState, DtdleStats } from '../types';

function isValidGameState(value: unknown): value is DtdleGameState {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Partial<DtdleGameState>;
  return (
    typeof v.date === 'string' &&
    Array.isArray(v.guessedSlugs) &&
    v.guessedSlugs.every((s) => typeof s === 'string') &&
    typeof v.solved === 'boolean'
  );
}

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

function freshState(date: string): DtdleGameState {
  return { date, guessedSlugs: [], solved: false };
}

export function useDtdleGame() {
  const { data: characters, loading, error } = useCharacters();
  const todayStr = useMemo(() => getTodayIsoDate(), []);

  const eligible = useMemo(
    () => getEligibleCharacters(characters),
    [characters]
  );

  const answer = useMemo(() => {
    if (eligible.length === 0) return null;
    const sortedSlugs = eligible.map((c) => c.slug).sort();
    const answerSlug = getTodayAnswerSlug(todayStr, sortedSlugs);
    return eligible.find((c) => c.slug === answerSlug) ?? null;
  }, [eligible, todayStr]);

  const [gameState, setGameState] = useState<DtdleGameState>(() =>
    readStoredJson(STORAGE_KEY.DTDLE_STATE, freshState(todayStr), isValidGameState)
  );

  const [stats, setStats] = useState<DtdleStats>(() =>
    readStoredJson(STORAGE_KEY.DTDLE_STATS, DEFAULT_STATS, isValidStats)
  );

  useEffect(() => {
    if (gameState.date !== todayStr) {
      setGameState(freshState(todayStr));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEY.DTDLE_STATE, gameState);
  }, [gameState]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEY.DTDLE_STATS, stats);
  }, [stats]);

  const guessedCharacters = useMemo(
    () =>
      gameState.guessedSlugs
        .map((slug) => eligible.find((c) => c.slug === slug))
        .filter((c): c is NonNullable<typeof c> => c != null),
    [gameState.guessedSlugs, eligible]
  );

  function submitGuess(slug: string) {
    if (!answer || gameState.solved || gameState.guessedSlugs.includes(slug)) {
      return;
    }
    const isWin = slug === answer.slug;
    setGameState((prev) => ({
      ...prev,
      guessedSlugs: [...prev.guessedSlugs, slug],
      solved: prev.solved || isWin,
    }));

    if (isWin) {
      setStats((prev) => {
        const isConsecutive =
          prev.lastPlayedDate === addDaysIso(todayStr, -1);
        const currentStreak = isConsecutive ? prev.currentStreak + 1 : 1;
        return {
          currentStreak,
          maxStreak: Math.max(prev.maxStreak, currentStreak),
          gamesPlayed: prev.gamesPlayed + 1,
          lastPlayedDate: todayStr,
        };
      });
    }
  }

  return {
    loading,
    error,
    eligible,
    answer,
    gameState,
    stats,
    guessedCharacters,
    submitGuess,
  };
}
