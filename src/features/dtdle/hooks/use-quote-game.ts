import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useMemo } from 'react';
import { getQuoteEligibleCharacters } from '../modes/quote/utils';
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

const MODE_SALT = 'quote';

export function useQuoteGame() {
  const { data: characters, loading, error } = useCharacters();
  const todayStr = useTodayIsoDate();

  const eligible = useMemo(() => getEligibleCharacters(characters), [characters]);
  const answerPool = useMemo(
    () => getQuoteEligibleCharacters(characters),
    [characters]
  );

  const answer = useDailyAnswer(answerPool, todayStr, MODE_SALT);

  const [gameState, setGameState] = useDailyGameState(
    STORAGE_KEY.DTDLE_QUOTE_STATE,
    todayStr,
    freshGameState,
    isValidGameState
  );

  const { stats, recordWin } = useDailyStats(
    STORAGE_KEY.DTDLE_QUOTE_STATS,
    todayStr
  );

  const guessedCharacters = useGuessedCharacters(eligible, gameState.guessedSlugs);

  const submitGuess = useSubmitGuess(setGameState, answer, recordWin);

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
