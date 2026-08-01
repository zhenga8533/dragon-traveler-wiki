import { useMemo } from 'react';
import type { Character } from '@/features/characters/types';
import { buildCharacterByIdentityMap } from '@/features/characters/utils/character-route';

export function useNoblePhantasmCharacterIndex(characters: Character[]) {
  return useMemo(() => {
    const byIdentity = buildCharacterByIdentityMap(characters);
    const names = new Map(
      [...byIdentity].map(([slug, character]) => [slug, character.name])
    );
    return { byIdentity, names };
  }, [characters]);
}
