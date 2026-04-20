import { QUALITY_ORDER } from '@/constants/colors';
import type { Character, CharacterClass } from '@/features/characters/types';
import type { FactionName } from '@/types/faction';
import type { Quality } from '@/types/quality';
import { getCharacterIdentityKey } from './character-route';
import { parseEffectRefs } from '@/utils/parse-effect-refs';

export interface CharacterFilters {
  search: string;
  qualities: Quality[];
  classes: CharacterClass[];
  factions: FactionName[];
  tiers: string[];
  statusEffects: string[];
  globalOnly: boolean | null;
  upcomingOnly: boolean;
  ownedOnly: boolean;
  minStarLevel: string | null;
  maxStarLevel: string | null;
}

export const EMPTY_FILTERS: CharacterFilters = {
  search: '',
  qualities: [],
  classes: [],
  factions: [],
  tiers: [],
  statusEffects: [],
  globalOnly: null,
  upcomingOnly: false,
  ownedOnly: false,
  minStarLevel: null,
  maxStarLevel: null,
};

/** Apply all active filters to a list of characters. Empty arrays mean no filter. */
export function filterCharacters(
  characters: Character[],
  filters: CharacterFilters,
  tierLookup?: Map<string, string>,
  ownedCharacters?: Record<string, string>,
  starLevelOrder?: string[]
): Character[] {
  return characters.filter((c) => {
    if (
      filters.search &&
      !c.name.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.qualities.length > 0 &&
      !filters.qualities.includes(c.quality)
    ) {
      return false;
    }
    if (
      filters.classes.length > 0 &&
      !filters.classes.includes(c.character_class)
    ) {
      return false;
    }
    if (
      filters.factions.length > 0 &&
      !c.factions.some((f) => filters.factions.includes(f))
    ) {
      return false;
    }
    if (filters.tiers.length > 0 && tierLookup) {
      const tier =
        tierLookup.get(getCharacterIdentityKey(c)) ??
        tierLookup.get(c.name) ??
        'N/A';
      if (!filters.tiers.includes(tier)) {
        return false;
      }
    }
    if (filters.statusEffects.length > 0) {
      const charEffects = extractCharacterEffectRefs(c);
      if (!filters.statusEffects.some((e) => charEffects.includes(e))) {
        return false;
      }
    }
    if (filters.globalOnly !== null && c.is_global !== filters.globalOnly) {
      return false;
    }
    if (filters.upcomingOnly) {
      const lore = c.lore;
      const hasLore = Array.isArray(lore) ? lore.length > 1 : false;
      if (c.is_global || !hasLore) return false;
    }

    const identityKey = getCharacterIdentityKey(c);
    const ownedLevel = ownedCharacters?.[identityKey] ?? null;

    if (filters.ownedOnly && ownedLevel === null) {
      return false;
    }
    if (
      (filters.minStarLevel || filters.maxStarLevel) &&
      starLevelOrder &&
      starLevelOrder.length > 0
    ) {
      if (ownedLevel === null) return false;
      const ownedIndex = starLevelOrder.indexOf(ownedLevel);
      if (filters.minStarLevel) {
        const minIndex = starLevelOrder.indexOf(filters.minStarLevel);
        if (ownedIndex < minIndex) return false;
      }
      if (filters.maxStarLevel) {
        const maxIndex = starLevelOrder.indexOf(filters.maxStarLevel);
        if (ownedIndex > maxIndex) return false;
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

/** Compare two characters by quality, then alphabetically by name. */
export function compareCharactersByQualityThenName(
  a: Character,
  b: Character
): number {
  const qualityIndexA = QUALITY_ORDER.indexOf(a.quality);
  const qualityIndexB = QUALITY_ORDER.indexOf(b.quality);
  if (qualityIndexA !== qualityIndexB) return qualityIndexA - qualityIndexB;
  return a.name.localeCompare(b.name);
}

/** Sort characters by quality, then alphabetically by name. */
export function sortCharactersByQuality(characters: Character[]): Character[] {
  return characters.sort(compareCharactersByQualityThenName);
}
