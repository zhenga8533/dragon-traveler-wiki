import type { Character } from '@/features/characters/types';
import type { Quality } from '@/types/quality';
import type { NoblePhantasm } from '../types';

export type CharacterLinkFilter = 'valid' | 'invalid';

export interface NoblePhantasmFilters {
  search: string;
  qualities: Quality[];
  characterLinks: CharacterLinkFilter[];
}

export const EMPTY_NOBLE_PHANTASM_FILTERS: NoblePhantasmFilters = {
  search: '',
  qualities: [],
  characterLinks: [],
};

export function hasValidCharacterLink(
  noblePhantasm: NoblePhantasm,
  characterBySlug: ReadonlyMap<string, Character>
): boolean {
  return Boolean(
    noblePhantasm.character_slug &&
      characterBySlug.has(noblePhantasm.character_slug)
  );
}

export function matchesNoblePhantasmFilters(
  noblePhantasm: NoblePhantasm,
  filters: NoblePhantasmFilters,
  characterBySlug: ReadonlyMap<string, Character>
): boolean {
  if (
    filters.qualities.length > 0 &&
    !filters.qualities.includes(noblePhantasm.quality)
  ) {
    return false;
  }

  if (filters.characterLinks.length > 0) {
    const linkState = hasValidCharacterLink(noblePhantasm, characterBySlug)
      ? 'valid'
      : 'invalid';
    if (!filters.characterLinks.includes(linkState)) return false;
  }

  if (!filters.search.trim()) return true;
  const query = filters.search.toLowerCase();
  const characterName =
    characterBySlug.get(noblePhantasm.character_slug ?? '')?.name ?? '';
  return (
    noblePhantasm.name.toLowerCase().includes(query) ||
    characterName.toLowerCase().includes(query)
  );
}
