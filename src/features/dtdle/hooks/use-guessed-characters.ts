import type { Character } from '@/features/characters/types';
import { useMemo } from 'react';

/** Resolves guessed slugs to full character records, in guess order. */
export function useGuessedCharacters(
  eligible: Character[],
  guessedSlugs: string[]
): Character[] {
  return useMemo(() => {
    const bySlug = new Map(eligible.map((c) => [c.slug, c]));
    return guessedSlugs
      .map((slug) => bySlug.get(slug))
      .filter((c): c is Character => c != null);
  }, [eligible, guessedSlugs]);
}
