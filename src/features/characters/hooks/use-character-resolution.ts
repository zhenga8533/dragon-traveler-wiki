import { useCallback, useMemo } from 'react';
import type { Character } from '@/features/characters/types';
import {
  buildCharacterByIdentityMap,
  buildPreferredCharacterByNameMap,
  getCharacterByReferenceKey,
} from '@/features/characters/utils/character-route';

export interface CharacterResolution {
  preferredByName: Map<string, Character>;
  byIdentity: Map<string, Character>;
  resolve: (key: string) => Character | undefined;
}

export function useCharacterResolution(
  characters: Character[]
): CharacterResolution {
  const preferredByName = useMemo(
    () => buildPreferredCharacterByNameMap(characters),
    [characters]
  );
  const byIdentity = useMemo(
    () => buildCharacterByIdentityMap(characters),
    [characters]
  );
  const resolve = useCallback(
    (key: string) =>
      getCharacterByReferenceKey(key, preferredByName, byIdentity),
    [preferredByName, byIdentity]
  );
  return { preferredByName, byIdentity, resolve };
}
