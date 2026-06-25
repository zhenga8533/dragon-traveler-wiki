import { QUALITY_ORDER } from '@/constants/quality';
import type { Character } from '@/features/characters/types';
import type { Quality } from '@/types/quality';
import { safeDecodeURIComponent, toEntitySlug } from '@/utils/entity-slug';

const QUALITY_RANK = new Map<Quality, number>(
  QUALITY_ORDER.map((quality, index) => [quality, index])
);

function normalizeCharacterNameKey(value: string): string {
  return value.trim().toLowerCase();
}

function shouldPreferCandidate(
  existing: Character,
  candidate: Character
): boolean {
  const existingRank =
    QUALITY_RANK.get(existing.quality) ?? Number.MAX_SAFE_INTEGER;
  const candidateRank =
    QUALITY_RANK.get(candidate.quality) ?? Number.MAX_SAFE_INTEGER;

  if (candidateRank < existingRank) {
    return true;
  }

  if (candidateRank === existingRank) {
    const existingUpdated = existing.last_updated ?? 0;
    const candidateUpdated = candidate.last_updated ?? 0;
    return candidateUpdated > existingUpdated;
  }

  return false;
}

function getPreferredCharacterByName(
  name: string,
  preferredByName: Map<string, Character>
): Character | undefined {
  const exact = preferredByName.get(name);
  if (exact) return exact;

  const trimmed = name.trim();
  if (trimmed !== name) {
    const trimmedMatch = preferredByName.get(trimmed);
    if (trimmedMatch) return trimmedMatch;
  }

  const normalized = normalizeCharacterNameKey(trimmed);
  if (!normalized) return undefined;

  return preferredByName.get(normalized);
}

/** Returns the stable identity key for a character (its slug, which always embeds quality). */
export function getCharacterIdentityKey(character: Character): string {
  return character.slug;
}

/** Returns the route base slug for a character (the character's data slug). */
export function getCharacterBaseSlug(character: Character): string;
export function getCharacterBaseSlug(name: string): string;
export function getCharacterBaseSlug(characterOrName: Character | string): string {
  if (typeof characterOrName === 'string') {
    return toEntitySlug(characterOrName);
  }
  return characterOrName.slug;
}

export function buildCharacterNameCounts(
  characters: Character[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const character of characters) {
    const key = character.slug;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function getCharacterRouteSlug(character: Character): string {
  return character.slug;
}

export function getCharacterRoutePath(character: Character): string {
  return `/characters/${getCharacterRouteSlug(character)}`;
}

/** Builds a route path by name only (legacy; prefers slug-based lookup instead). */
export function getCharacterRoutePathByName(name: string): string {
  return `/characters/${toEntitySlug(name)}`;
}

export function buildPreferredCharacterByNameMap(
  characters: Character[]
): Map<string, Character> {
  const map = new Map<string, Character>();

  for (const candidate of characters) {
    const keys = new Set([
      candidate.name,
      normalizeCharacterNameKey(candidate.name),
    ]);

    for (const key of keys) {
      if (!key) continue;
      const existing = map.get(key);
      if (!existing || shouldPreferCandidate(existing, candidate)) {
        map.set(key, candidate);
      }
    }
  }

  return map;
}

export function buildCharacterByIdentityMap(
  characters: Character[]
): Map<string, Character> {
  const map = new Map<string, Character>();
  for (const character of characters) {
    map.set(getCharacterIdentityKey(character), character);
  }
  return map;
}

export function getCharacterByReferenceKey(
  characterKey: string,
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>
): Character | undefined {
  return (
    byIdentity.get(characterKey) ??
    getPreferredCharacterByName(characterKey, preferredByName)
  );
}

export function resolveCharacterReferenceKey(
  nameOrSlug: string,
  _quality: string | null | undefined,
  characters: Character[],
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>
): string {
  // Direct slug lookup — primary path since slugs are globally unique
  if (byIdentity.has(nameOrSlug)) return nameOrSlug;

  // Name-based lookup (handles display names like "Athena")
  const preferred = getPreferredCharacterByName(nameOrSlug, preferredByName);
  if (preferred) return preferred.slug;

  // Fallback: scan by slug or normalized name
  const normalizedName = normalizeCharacterNameKey(nameOrSlug);
  const first = characters.find(
    (character) =>
      character.slug === nameOrSlug ||
      normalizeCharacterNameKey(character.name) === normalizedName
  );
  if (first) return first.slug;

  return nameOrSlug;
}

export function toCharacterReferenceFromKey(
  characterKey: string,
  _preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>
): { character_slug: string } {
  const character = byIdentity.get(characterKey);
  return { character_slug: character?.slug ?? characterKey };
}

export function resolveCharacterByNameAndQuality(
  nameOrSlug: string,
  _quality: string | null | undefined,
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>
): Character | null {
  // Direct slug lookup — primary path since slugs are globally unique
  const bySlug = byIdentity.get(nameOrSlug);
  if (bySlug) return bySlug;

  // Name-based lookup (handles display names like "Athena")
  return getPreferredCharacterByName(nameOrSlug, preferredByName) ?? null;
}

export interface CharacterRouteMatch {
  character: Character | null;
  variants: Character[];
  baseSlug: string | null;
  incomingSlug: string;
}

export function resolveCharacterRoute(
  characters: Character[],
  param: string | undefined
): CharacterRouteMatch {
  const incomingSlug = safeDecodeURIComponent(param ?? '')
    .trim()
    .toLowerCase();
  if (!incomingSlug) {
    return {
      character: null,
      variants: [],
      baseSlug: null,
      incomingSlug,
    };
  }

  const matchedByExactSlug = characters.find(
    (entry) => getCharacterRouteSlug(entry).toLowerCase() === incomingSlug
  );
  if (matchedByExactSlug) {
    const baseSlug = matchedByExactSlug.slug;
    const variants = characters.filter((entry) => entry.slug === baseSlug);
    return {
      character: matchedByExactSlug,
      variants,
      baseSlug,
      incomingSlug,
    };
  }

  const baseSlug = incomingSlug;
  const variants = characters.filter((entry) => entry.slug === baseSlug);

  if (variants.length === 1) {
    return {
      character: variants[0],
      variants,
      baseSlug,
      incomingSlug,
    };
  }

  // Legacy fallback: try name-derived slug for old bookmarked URLs
  const legacySlug = toEntitySlug(incomingSlug);
  const legacyVariants = characters.filter(
    (entry) => entry.slug === legacySlug || toEntitySlug(entry.name) === legacySlug
  );

  if (legacyVariants.length === 1) {
    return {
      character: legacyVariants[0],
      variants: legacyVariants,
      baseSlug: legacyVariants[0].slug,
      incomingSlug,
    };
  }

  return {
    character: null,
    variants: legacyVariants.length > 0 ? legacyVariants : variants,
    baseSlug: legacyVariants.length > 0 ? legacySlug : variants.length > 0 ? baseSlug : null,
    incomingSlug,
  };
}
