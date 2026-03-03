import { QUALITY_ORDER } from '../constants/quality';
import type { Character } from '../types/character';
import type { Quality } from '../types/quality';
import { safeDecodeURIComponent, toEntitySlug } from './entity-slug';

const QUALITY_RANK = new Map<Quality, number>(
  QUALITY_ORDER.map((quality, index) => [quality, index])
);

function normalizeQualitySuffix(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_+]/g, '')
    .replace(/^_+|_+$/g, '');
}

export function getCharacterIdentityKey(
  characterOrName: Character | string,
  quality?: string
): string {
  if (typeof characterOrName === 'string') {
    return `${characterOrName.trim().toLowerCase()}__${(quality ?? '').trim().toLowerCase()}`;
  }
  return `${characterOrName.name.trim().toLowerCase()}__${characterOrName.quality.trim().toLowerCase()}`;
}

export function getCharacterBaseSlug(name: string): string {
  return toEntitySlug(name);
}

export function buildCharacterNameCounts(
  characters: Character[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const character of characters) {
    const key = getCharacterBaseSlug(character.name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function getCharacterRouteSlug(
  character: Character,
  nameCounts?: Map<string, number>
): string {
  const base = getCharacterBaseSlug(character.name);
  const count = nameCounts?.get(base) ?? 1;
  if (count <= 1) return base;
  const qualitySuffix = normalizeQualitySuffix(character.quality);
  return qualitySuffix ? `${base}_${qualitySuffix}` : base;
}

export function getCharacterRoutePath(
  character: Character,
  nameCounts?: Map<string, number>
): string {
  return `/characters/${getCharacterRouteSlug(character, nameCounts)}`;
}

export function getCharacterRoutePathByName(name: string): string {
  return `/characters/${getCharacterBaseSlug(name)}`;
}

export function buildPreferredCharacterByNameMap(
  characters: Character[]
): Map<string, Character> {
  const map = new Map<string, Character>();

  for (const candidate of characters) {
    const existing = map.get(candidate.name);
    if (!existing) {
      map.set(candidate.name, candidate);
      continue;
    }

    const existingRank =
      QUALITY_RANK.get(existing.quality) ?? Number.MAX_SAFE_INTEGER;
    const candidateRank =
      QUALITY_RANK.get(candidate.quality) ?? Number.MAX_SAFE_INTEGER;

    if (candidateRank < existingRank) {
      map.set(candidate.name, candidate);
      continue;
    }

    if (candidateRank === existingRank) {
      const existingUpdated = existing.last_updated ?? 0;
      const candidateUpdated = candidate.last_updated ?? 0;
      if (candidateUpdated > existingUpdated) {
        map.set(candidate.name, candidate);
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
  return byIdentity.get(characterKey) ?? preferredByName.get(characterKey);
}

export function resolveCharacterReferenceKey(
  name: string,
  quality: string | null | undefined,
  characters: Character[],
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>
): string {
  const exactKey = getCharacterIdentityKey(name, quality ?? '');
  if (quality && byIdentity.has(exactKey)) {
    return exactKey;
  }

  const preferred = preferredByName.get(name);
  if (preferred) return getCharacterIdentityKey(preferred);

  const first = characters.find((character) => character.name === name);
  if (first) return getCharacterIdentityKey(first);

  return exactKey;
}

export function toCharacterReferenceFromKey(
  characterKey: string,
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>,
  nameCounts?: Map<string, number>
): { character_name: string; character_quality?: Quality } {
  const character = getCharacterByReferenceKey(
    characterKey,
    preferredByName,
    byIdentity
  );
  const characterName = character?.name ?? characterKey;
  const isMultiQualityName =
    (nameCounts?.get(getCharacterBaseSlug(characterName)) ?? 1) > 1;

  return {
    character_name: characterName,
    ...(isMultiQualityName && character?.quality
      ? { character_quality: character.quality }
      : {}),
  };
}

export function resolveCharacterByNameAndQuality(
  name: string,
  quality: string | null | undefined,
  preferredByName: Map<string, Character>,
  byIdentity: Map<string, Character>
): Character | null {
  const identity = getCharacterIdentityKey(name, quality ?? '');
  const exact = byIdentity.get(identity);
  if (exact) return exact;
  return preferredByName.get(name) ?? null;
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
    const baseSlug = getCharacterBaseSlug(matchedByExactSlug.name);
    const variants = characters.filter(
      (entry) => getCharacterBaseSlug(entry.name) === baseSlug
    );
    return {
      character: matchedByExactSlug,
      variants,
      baseSlug,
      incomingSlug,
    };
  }

  const baseSlug = toEntitySlug(incomingSlug);
  const variants = characters.filter(
    (entry) => getCharacterBaseSlug(entry.name) === baseSlug
  );

  if (variants.length === 1) {
    return {
      character: variants[0],
      variants,
      baseSlug,
      incomingSlug,
    };
  }

  return {
    character: null,
    variants,
    baseSlug: variants.length > 0 ? baseSlug : null,
    incomingSlug,
  };
}
