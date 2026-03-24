import { useDataFetch } from '@/hooks';
import { useMemo } from 'react';

type CharactersChanges = Record<string, { added?: number }>;

/** Returns a Set of lowercased identity keys (name__quality) for characters with the latest "added" timestamp. */
export function useNewCharacters(): Set<string> {
  const { data } = useDataFetch<CharactersChanges>(
    'data/changes/characters.json',
    {}
  );

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
        // Key format in JSON: "Name__Quality" — normalize to lowercase to match getCharacterIdentityKey
        newKeys.add(key.trim().toLowerCase());
      }
    }
    return newKeys;
  }, [data]);
}
