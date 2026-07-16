import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useMemo } from 'react';
import {
  getIllustrationEligibleCharacters,
  pickDailyIllustration,
  pickIllustrationFocusPoint,
} from '../modes/illustration/utils';
import { useDailyAnswer } from './use-daily-answer';
import {
  freshGameState,
  isValidGameState,
  useDailyGameState,
} from './use-daily-game-state';
import { useDailyStats } from './use-daily-stats';
import { useGuessedCharacters } from './use-guessed-characters';
import { useSubmitGuess } from './use-submit-guess';
import { useTodayIsoDate } from './use-today-iso-date';

const MODE_SALT = 'illustration';
const ZOOM_STEPS = [6, 4.5, 3, 2, 1.4, 1];

export function useIllustrationGame() {
  const { data: characters, loading, error, retry } = useCharacters();
  const todayStr = useTodayIsoDate();

  const eligible = useMemo(
    () => getIllustrationEligibleCharacters(characters),
    [characters]
  );

  const answer = useDailyAnswer(eligible, todayStr, MODE_SALT);

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

  const guessedCharacters = useGuessedCharacters(eligible, gameState.guessedSlugs);

  const submitGuess = useSubmitGuess(setGameState, answer, recordWin);

  return {
    loading,
    error,
    retry,
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
