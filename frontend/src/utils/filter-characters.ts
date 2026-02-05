import type { Character, CharacterClass, Quality } from '../types/character';
import type { FactionName } from '../types/faction';
import { parseEffectRefs } from './parse-effect-refs';

export interface CharacterFilters {
  search: string;
  qualities: Quality[];
  classes: CharacterClass[];
  factions: FactionName[];
  statusEffects: string[];
}

export const EMPTY_FILTERS: CharacterFilters = {
  search: '',
  qualities: [],
  classes: [],
  factions: [],
  statusEffects: [],
};

/** Apply all active filters to a list of characters. Empty arrays mean no filter. */
export function filterCharacters(characters: Character[], filters: CharacterFilters): Character[] {
  return characters.filter((c) => {
    if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.qualities.length > 0 && !filters.qualities.includes(c.quality)) {
      return false;
    }
    if (filters.classes.length > 0 && !filters.classes.includes(c.character_class)) {
      return false;
    }
    if (filters.factions.length > 0 && !c.factions.some((f) => filters.factions.includes(f))) {
      return false;
    }
    if (filters.statusEffects.length > 0) {
      const charEffects = extractCharacterEffectRefs(c);
      if (!filters.statusEffects.some((e) => charEffects.includes(e))) {
        return false;
      }
    }
    return true;
  });
}

function extractCharacterEffectRefs(character: Character): string[] {
  const refs: string[] = [];
  for (const skill of character.skills) {
    refs.push(...parseEffectRefs(skill.description));
  }
  return refs;
}

/** Get all unique effect reference names across all characters' skill descriptions. */
export function extractAllEffectRefs(characters: Character[]): string[] {
  const names = new Set<string>();
  for (const c of characters) {
    for (const skill of c.skills) {
      for (const name of parseEffectRefs(skill.description)) {
        names.add(name);
      }
    }
  }
  return [...names].sort();
}
