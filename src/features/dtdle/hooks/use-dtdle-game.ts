import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useMemo } from 'react';
import {
  getEligibleCharacters,
  getTodayAnswerSlug,
  getTodayIsoDate,
} from '../utils/daily-answer';
import {
  freshGameState,
  isValidGameState,
  useDailyGameState,
} from './use-daily-game-state';
import { useDailyStats } from './use-daily-stats';

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

  const [gameState, setGameState] = useDailyGameState(
    STORAGE_KEY.DTDLE_STATE,
    todayStr,
    freshGameState,
    isValidGameState
  );

  const { stats, recordWin } = useDailyStats(STORAGE_KEY.DTDLE_STATS, todayStr);

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

    if (isWin) recordWin();
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
