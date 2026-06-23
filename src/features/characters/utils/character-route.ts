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

/**
 * Returns the stable identity key for a character.
 *
 * - Character object → `slug__quality` (matches data repo identity.py)
 * - String overload → lowercased `name__quality` (legacy; for React keys only,
 *   NOT for change-history JSON lookups)
 */
export function getCharacterIdentityKey(
  characterOrName: Character | string,
  quality?: string
): string {
  if (typeof characterOrName === 'string') {
    return `${characterOrName.trim().toLowerCase()}__${(quality ?? '').trim().toLowerCase()}`;
  }
  return `${characterOrName.slug}__${characterOrName.quality}`;
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

export function getCharacterRouteSlug(
  character: Character,
  nameCounts?: Map<string, number>
): string {
  const base = character.slug;
  const count = nameCounts?.get(base) ?? 1;
  if (count <= 1) return base;
  const qualitySuffix = toEntitySlug(character.quality, { allowPlus: true });
  return qualitySuffix ? `${base}_${qualitySuffix}` : base;
}

export function getCharacterRoutePath(
  character: Character,
  nameCounts?: Map<string, number>
): string {
  return `/characters/${getCharacterRouteSlug(character, nameCounts)}`;
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
  quality: string | null | undefined,
  characters: Character[],
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>
): string {
  // Try direct slug+quality lookup in byIdentity (slug__Quality)
  if (quality) {
    const slugKey = `${nameOrSlug}__${quality}`;
    if (byIdentity.has(slugKey)) return slugKey;
  }

  const exactKey = getCharacterIdentityKey(nameOrSlug, quality ?? '');
  if (quality && byIdentity.has(exactKey)) {
    return exactKey;
  }

  const preferred = getPreferredCharacterByName(nameOrSlug, preferredByName);
  if (preferred) return getCharacterIdentityKey(preferred);

  const normalizedName = normalizeCharacterNameKey(nameOrSlug);
  const first = characters.find(
    (character) =>
      character.slug === nameOrSlug ||
      normalizeCharacterNameKey(character.name) === normalizedName
  );
  if (first) return getCharacterIdentityKey(first);

  return exactKey;
}

export function toCharacterReferenceFromKey(
  characterKey: string,
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>,
  nameCounts?: Map<string, number>
): { character_slug: string; character_quality?: Quality } {
  const character = getCharacterByReferenceKey(
    characterKey,
    preferredByName,
    byIdentity
  );
  const characterSlug = character?.slug ?? characterKey;
  const isMultiQualityName =
    (nameCounts?.get(character?.slug ?? toEntitySlug(character?.name ?? characterKey)) ?? 1) > 1;

  return {
    character_slug: characterSlug,
    ...(isMultiQualityName && character?.quality
      ? { character_quality: character.quality }
      : {}),
  };
}

export function resolveCharacterByNameAndQuality(
  nameOrSlug: string,
  quality: string | null | undefined,
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>
): Character | null {
  // Try direct slug+quality lookup (slug__Quality format used by byIdentity)
  if (quality) {
    const slugKey = `${nameOrSlug}__${quality}`;
    const bySlug = byIdentity.get(slugKey);
    if (bySlug) return bySlug;
  }

  const identity = getCharacterIdentityKey(nameOrSlug, quality ?? '');
  const exact = byIdentity.get(identity);
  if (exact) return exact;

  const byName = getPreferredCharacterByName(nameOrSlug, preferredByName);
  if (byName) return byName;

  // Fallback: scan byIdentity for any char whose slug matches the input
  for (const char of byIdentity.values()) {
    if (char.slug === nameOrSlug) return char;
  }

  return null;
}

export interface CharacterRouteMatch {
  character: Character | null;
  variants: Character[];
  baseSlug: string | null;
  incomingSlug: string;
}

export function resolveCharacterRoute(
  characters: Character[],
  param: string | undefined,
  nameCounts?: Map<string, number>
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

  const resolvedCounts = nameCounts ?? buildCharacterNameCounts(characters);

  const matchedByExactSlug = characters.find(
    (entry) =>
      getCharacterRouteSlug(entry, resolvedCounts).toLowerCase() ===
      incomingSlug
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
