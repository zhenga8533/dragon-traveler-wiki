import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useMemo } from 'react';
import { getEligibleCharacters } from '../utils/daily-answer';
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

export function useDtdleGame() {
  const { data: characters, loading, error, retry } = useCharacters();
  const todayStr = useTodayIsoDate();

  const eligible = useMemo(
    () => getEligibleCharacters(characters),
    [characters]
  );

  const answer = useDailyAnswer(eligible, todayStr);

  const [gameState, setGameState] = useDailyGameState(
    STORAGE_KEY.DTDLE_STATE,
    todayStr,
    freshGameState,
    isValidGameState
  );

  const { stats, recordWin } = useDailyStats(STORAGE_KEY.DTDLE_STATS, todayStr);

  const guessedCharacters = useGuessedCharacters(eligible, gameState.guessedSlugs);

  const submitGuess = useSubmitGuess(setGameState, answer, recordWin);

  return {
    loading,
    error,
    retry,
    eligible,
    answer,
    gameState,
    stats,
    guessedCharacters,
    submitGuess,
  };
}
