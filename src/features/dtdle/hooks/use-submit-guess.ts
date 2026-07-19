import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { DtdleGameState } from '../types';

/**
 * Shared submit logic for the modes whose game state is just a slug guess
 * list plus a `solved` flag (Classic and Quote). Ability and Illustration
 * have two-stage flows and keep their submit logic separate.
 *
 * The solved/duplicate guard runs inside the `setGameState` updater so it
 * reads the latest chained state rather than a stale render closure — two
 * guesses submitted in the same tick can't both mutate the game state. Win
 * recording is independently idempotent for the current UTC date.
 */
export function useSubmitGuess(
  setGameState: Dispatch<SetStateAction<DtdleGameState>>,
  answer: { slug: string } | null,
  recordWin: () => void
) {
  return useCallback(
    (slug: string) => {
      if (!answer) return;
      setGameState((prev) => {
        if (prev.solved || prev.guessedSlugs.includes(slug)) return prev;
        const isWin = slug === answer.slug;
        return {
          ...prev,
          guessedSlugs: [...prev.guessedSlugs, slug],
          solved: prev.solved || isWin,
        };
      });
      if (slug === answer.slug) recordWin();
    },
    [answer, setGameState, recordWin]
  );
}
