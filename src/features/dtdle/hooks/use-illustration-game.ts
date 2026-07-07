import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useMemo } from 'react';
import {
  getIllustrationEligibleCharacters,
  pickDailyIllustration,
  pickIllustrationFocusPoint,
} from '../modes/illustration/utils';
import { getTodayAnswerSlug, getTodayIsoDate } from '../utils/daily-answer';
import {
  freshGameState,
  isValidGameState,
  useDailyGameState,
} from './use-daily-game-state';
import { useDailyStats } from './use-daily-stats';

const MODE_SALT = 'illustration';
const ZOOM_STEPS = [6, 4.5, 3, 2, 1.4, 1];

export function useIllustrationGame() {
  const { data: characters, loading, error } = useCharacters();
  const todayStr = useMemo(() => getTodayIsoDate(), []);

  const eligible = useMemo(
    () => getIllustrationEligibleCharacters(characters),
    [characters]
  );

  const answer = useMemo(() => {
    if (eligible.length === 0) return null;
    const sortedSlugs = eligible.map((c) => c.slug).sort();
    const answerSlug = getTodayAnswerSlug(todayStr, sortedSlugs, MODE_SALT);
    return eligible.find((c) => c.slug === answerSlug) ?? null;
  }, [eligible, todayStr]);

  const illustration = useMemo(
    () => (answer ? pickDailyIllustration(answer) : null),
    [answer]
  );

  const focusPoint = useMemo(
    () => (answer ? pickIllustrationFocusPoint(answer, todayStr) : { x: 50, y: 50 }),
    [answer, todayStr]
  );

  const [gameState, setGameState] = useDailyGameState(
    STORAGE_KEY.DTDLE_ILLUSTRATION_STATE,
    todayStr,
    freshGameState,
    isValidGameState
  );

  const { stats, recordWin } = useDailyStats(
    STORAGE_KEY.DTDLE_ILLUSTRATION_STATS,
    todayStr
  );

  const wrongGuessCount = gameState.solved
    ? 0
    : gameState.guessedSlugs.length;
  const zoomScale =
    ZOOM_STEPS[Math.min(wrongGuessCount, ZOOM_STEPS.length - 1)];

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
    illustration,
    zoomScale,
    focusPoint,
    gameState,
    stats,
    guessedCharacters,
    submitGuess,
  };
}
