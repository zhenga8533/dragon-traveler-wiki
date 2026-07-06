import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useMemo } from 'react';
import { getQuoteEligibleCharacters } from '../modes/quote/utils';
import { getEligibleCharacters, getTodayAnswerSlug, getTodayIsoDate } from '../utils/daily-answer';
import { useDailyGameState } from './use-daily-game-state';
import { useDailyStats } from './use-daily-stats';
import type { DtdleGameState } from '../types';

const MODE_SALT = 'quote';

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

function freshState(date: string): DtdleGameState {
  return { date, guessedSlugs: [], solved: false };
}

export function useQuoteGame() {
  const { data: characters, loading, error } = useCharacters();
  const todayStr = useMemo(() => getTodayIsoDate(), []);

  const guessable = useMemo(() => getEligibleCharacters(characters), [characters]);
  const answerPool = useMemo(
    () => getQuoteEligibleCharacters(characters),
    [characters]
  );

  const answer = useMemo(() => {
    if (answerPool.length === 0) return null;
    const sortedSlugs = answerPool.map((c) => c.slug).sort();
    const answerSlug = getTodayAnswerSlug(todayStr, sortedSlugs, MODE_SALT);
    return answerPool.find((c) => c.slug === answerSlug) ?? null;
  }, [answerPool, todayStr]);

  const [gameState, setGameState] = useDailyGameState(
    STORAGE_KEY.DTDLE_QUOTE_STATE,
    todayStr,
    freshState,
    isValidGameState
  );

  const { stats, recordWin } = useDailyStats(
    STORAGE_KEY.DTDLE_QUOTE_STATS,
    todayStr
  );

  const guessedCharacters = useMemo(
    () =>
      gameState.guessedSlugs
        .map((slug) => guessable.find((c) => c.slug === slug))
        .filter((c): c is NonNullable<typeof c> => c != null),
    [gameState.guessedSlugs, guessable]
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

    if (isWin) recordWin();
  }

  return {
    loading,
    error,
    guessable,
    answer,
    gameState,
    stats,
    guessedCharacters,
    submitGuess,
  };
}
