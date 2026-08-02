import {
  useCharacterChanges,
  useCharacters,
} from '@/features/characters/hooks/use-characters-data';
import { getNewestActiveCharacterKeys } from '@/features/characters/utils/new-character-keys';
import { useMemo } from 'react';

/** Returns the active character slugs from the newest addition or re-addition batch. */
export function useNewCharacters(): Set<string> {
  const { data: changes } = useCharacterChanges();
  const { data: characters } = useCharacters();

  return useMemo(
    () =>
      getNewestActiveCharacterKeys(
        changes,
        characters.map(({ slug }) => slug),
      ),
    [changes, characters],
  );
}
