import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { DtdleGameState } from '../types';

/**
 * Shared submit logic for the modes whose game state is just a slug guess
 * list plus a `solved` flag (Classic, Illustration, Quote — Ability has an
 * extra character/category two-stage flow and stays separate).
 *
 * The solved/duplicate guard runs inside the `setGameState` updater so it
 * reads the latest chained state rather than a stale render closure — two
 * guesses submitted in the same tick can't both pass the guard and both
 * record a win.
 */
export function useSubmitGuess(
  setGameState: Dispatch<SetStateAction<DtdleGameState>>,
  answer: { slug: string } | null,
  recordWin: () => void
) {
  return useCallback(
    (slug: string) => {
      if (!answer) return;
      let didWin = false;
      setGameState((prev) => {
        if (prev.solved || prev.guessedSlugs.includes(slug)) return prev;
        const isWin = slug === answer.slug;
        didWin = isWin;
        return {
          ...prev,
          guessedSlugs: [...prev.guessedSlugs, slug],
          solved: prev.solved || isWin,
        };
      });
      if (didWin) recordWin();
    },
    [answer, setGameState, recordWin]
  );
}
