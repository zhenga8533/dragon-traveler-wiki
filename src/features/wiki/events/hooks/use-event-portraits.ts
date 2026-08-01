import { useContext, useMemo } from 'react';
import { getPortrait } from '@/assets';
import { CharacterSkinContext } from '@/contexts';
import type { Character } from '@/features/characters/types';
import { buildCharacterByIdentityMap } from '@/features/characters/utils/character-route';

export function useEventPortraits(characters: Character[]) {
  const { getSelectedSkin } = useContext(CharacterSkinContext);

  return useMemo(() => {
    const portraits = new Map<string, string>();
    for (const character of characters) {
      const portrait = getPortrait(
        character.name,
        character.slug,
        getSelectedSkin(character.slug)
      );
      if (!portrait) continue;

      portraits.set(character.slug, portrait);
      portraits.set(character.name, portrait);
      if (character.legacy_slug) portraits.set(character.legacy_slug, portrait);
    }
    return {
      portraitByReference: portraits,
      characterByIdentity: buildCharacterByIdentityMap(characters),
    };
  }, [characters, getSelectedSkin]);
}
