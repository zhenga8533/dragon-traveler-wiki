import { useContext, useMemo } from 'react';
import { getPortrait } from '@/assets';
import type { FieldDef } from '@/components/tools/SuggestModal';
import { QUALITY_ORDER } from '@/constants/quality';
import { CharacterSkinContext } from '@/contexts';
import type { Character } from '@/features/characters/types';
import { getCharacterRouteSlug } from '@/features/characters/utils/character-route';

export function useNoblePhantasmFormFields(
  characters: Character[],
): FieldDef[] {
  const { getSelectedSkin } = useContext(CharacterSkinContext);

  return useMemo(() => {
    const nameCounts = new Map<string, number>();
    for (const character of characters) {
      nameCounts.set(character.name, (nameCounts.get(character.name) ?? 0) + 1);
    }
    const characterOptions = characters
      .map((character) => ({
        value: getCharacterRouteSlug(character),
        label:
          (nameCounts.get(character.name) ?? 1) > 1
            ? `${character.name} (${character.quality})`
            : character.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const characterIcons: Record<string, string> = {};
    for (const character of characters) {
      const slug = getCharacterRouteSlug(character);
      const portrait = getPortrait(character.name, slug, getSelectedSkin(slug));
      if (portrait) characterIcons[slug] = portrait;
    }

    return [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Noble Phantasm name',
      },
      {
        name: 'quality',
        label: 'Quality',
        type: 'select',
        required: true,
        options: QUALITY_ORDER,
      },
      {
        name: 'character_slug',
        label: 'Character',
        type: 'select',
        required: true,
        options: characterOptions,
        optionIcons: characterIcons,
      },
    ];
  }, [characters, getSelectedSkin]);
}
