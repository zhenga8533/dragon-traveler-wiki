import { useCharacterChanges } from '@/features/characters/hooks/use-characters-data';
import { useMemo } from 'react';

type CharactersChanges = Record<string, { added?: number }>;

/** Returns a Set of character slugs for characters with the latest "added" timestamp. */
export function useNewCharacters(): Set<string> {
  const { data } = useCharacterChanges() as { data: CharactersChanges };

  return useMemo(() => {
    const entries = Object.entries(data);
    if (entries.length === 0) return new Set();

    let maxAdded = 0;
    for (const [, value] of entries) {
      if (value.added && value.added > maxAdded) {
        maxAdded = value.added;
      }
    }

    if (maxAdded === 0) return new Set();

    const newKeys = new Set<string>();
    for (const [key, value] of entries) {
      if (value.added === maxAdded) {
        newKeys.add(key);
      }
    }
    return newKeys;
  }, [data]);
}
