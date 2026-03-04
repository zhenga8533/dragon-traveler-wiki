import { useMemo } from 'react';
import type { Character } from '../types/character';
import {
  buildCharacterByIdentityMap,
  buildCharacterNameCounts,
  buildPreferredCharacterByNameMap,
} from '../utils/character-route';

export interface CharacterResolution {
  preferredByName: Map<string, Character>;
  byIdentity: Map<string, Character>;
  nameCounts: Map<string, number>;
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
  const nameCounts = useMemo(
    () => buildCharacterNameCounts(characters),
    [characters]
  );
  return { preferredByName, byIdentity, nameCounts };
}
