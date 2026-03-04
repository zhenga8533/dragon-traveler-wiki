import { normalizeKey } from '../utils';

// Dynamic imports for character assets
// Portraits load immediately (needed for character lists)
const portraitModules = import.meta.glob<{ default: string }>(
  './**/portrait.png',
  { eager: true }
);

// Illustrations, talents, and skills load on-demand (only needed on character detail pages)
const illustrationModules = import.meta.glob<{ default: string }>(
  './**/illustrations/*.{png,mp4}'
);

const talentModules = import.meta.glob<{ default: string }>('./**/talent.png');

const skillModules = import.meta.glob<{ default: string }>('./**/skills/*.png');

const CACHE_MAX_SIZE = 20;

function resolveAssetKey(characterName: string, characterKey?: string): string {
  const explicitKey = (characterKey ?? '').trim();
  return normalizeKey(explicitKey || characterName);
}

function normalizeQualityKey(value: string): string {
  return normalizeKey(value.replace(/\+/g, ' plus '));
}

function evictOldest(cache: Map<string, unknown>): void {
  if (cache.size > CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
}

function formatIllustrationName(fileName: string): string {
  const words = fileName
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

  return words
    .map((word) => word.replace(/^\w/, (char) => char.toUpperCase()))
    .join(' ');
}

export interface CharacterIllustration {
  name: string;
  src: string;
  type: 'image' | 'video';
}

// Build lookup maps
const portraits = new Map<string, string>();
const illustrationLoaders = new Map<
  string,
  Array<{
    name: string;
    loader: () => Promise<{ default: string }>;
    type: 'image' | 'video';
  }>
>();
const talentLoaders = new Map<string, () => Promise<{ default: string }>>();
const skillLoaders = new Map<
  string,
  Map<string, () => Promise<{ default: string }>>
>();

// Cache for loaded assets
const illustrationsCache = new Map<string, CharacterIllustration[]>();
const talentsCache = new Map<string, string>();
const skillsCache = new Map<string, Map<string, string>>();

// Build portraits map (eager loading)
for (const [path, module] of Object.entries(portraitModules)) {
  // path is like "./fenrir/portrait.png"
  const match = path.match(/\.\/([^/]+)\/portrait\.png$/);
  if (match) {
    portraits.set(normalizeKey(match[1]), module.default);
  }
}

// Build illustration loaders map (lazy loading)
for (const [path, loader] of Object.entries(illustrationModules)) {
  // path is like "./fenrir/illustrations/default.png" or "./fenrir/illustrations/intro.mp4"
  const match = path.match(/\.\/([^/]+)\/illustrations\/([^/]+)\.(png|mp4)$/);
  if (match) {
    const [, charKey, illustrationName, extension] = match;
    const normalizedCharKey = normalizeKey(charKey);
    if (!illustrationLoaders.has(normalizedCharKey)) {
      illustrationLoaders.set(normalizedCharKey, []);
    }
    illustrationLoaders.get(normalizedCharKey)!.push({
      name: formatIllustrationName(illustrationName),
      loader: loader as () => Promise<{ default: string }>,
      type: extension === 'mp4' ? 'video' : 'image',
    });
  }
}

// Build talent loaders map (lazy loading)
for (const [path, loader] of Object.entries(talentModules)) {
  // path is like "./fenrir/talent.png"
  const match = path.match(/\.\/([^/]+)\/talent\.png$/);
  if (match) {
    talentLoaders.set(
      normalizeKey(match[1]),
      loader as () => Promise<{ default: string }>
    );
  }
}

// Build skill loaders map (lazy loading)
for (const [path, loader] of Object.entries(skillModules)) {
  // path is like "./fenrir/skills/skill-name.png"
  const match = path.match(/\.\/([^/]+)\/skills\/([^/]+)\.png$/);
  if (match) {
    const [, charKey, skillName] = match;
    const normalizedCharKey = normalizeKey(charKey);
    if (!skillLoaders.has(normalizedCharKey)) {
      skillLoaders.set(normalizedCharKey, new Map());
    }
    skillLoaders
      .get(normalizedCharKey)!
      .set(
        normalizeKey(skillName),
        loader as () => Promise<{ default: string }>
      );
  }
}

export function getPortrait(
  characterName: string,
  characterKey?: string,
  quality?: string
): string | undefined {
  const normalizedName = normalizeKey(characterName);
  const resolvedKey = resolveAssetKey(characterName, characterKey);

  const candidateKeys: string[] = [];

  if (resolvedKey) {
    candidateKeys.push(resolvedKey);
  }

  if (quality) {
    const qualityKey = `${normalizedName}_${normalizeQualityKey(quality)}`;
    if (!candidateKeys.includes(qualityKey)) {
      candidateKeys.unshift(qualityKey);
    }

    // Backward-compatible fallback for previously normalized quality keys.
    const legacyQualityKey = `${normalizedName}_${normalizeKey(quality)}`;
    if (!candidateKeys.includes(legacyQualityKey)) {
      candidateKeys.push(legacyQualityKey);
    }
  }

  if (!candidateKeys.includes(normalizedName)) {
    candidateKeys.push(normalizedName);
  }

  for (const key of candidateKeys) {
    const portrait = portraits.get(key);
    if (portrait) return portrait;
  }

  return undefined;
}

export async function getIllustrations(
  characterName: string,
  characterKey?: string
): Promise<CharacterIllustration[]> {
  const key = resolveAssetKey(characterName, characterKey);

  // Check cache first
  if (illustrationsCache.has(key)) {
    return illustrationsCache.get(key)!;
  }

  // Load illustrations
  const loaders = illustrationLoaders.get(key);
  if (!loaders || loaders.length === 0) {
    return [];
  }

  const illustrations = await Promise.all(
    loaders.map(async ({ name, loader, type }) => ({
      name,
      src: (await loader()).default,
      type,
    }))
  );

  // Cache the results
  illustrationsCache.set(key, illustrations);
  evictOldest(illustrationsCache);
  return illustrations;
}

// For backwards compatibility - returns first illustration
export async function getIllustration(
  characterName: string,
  characterKey?: string
): Promise<string | undefined> {
  const list = await getIllustrations(characterName, characterKey);
  return list.length > 0 ? list[0].src : undefined;
}

export async function getTalentIcon(
  characterName: string,
  characterKey?: string
): Promise<string | undefined> {
  const key = resolveAssetKey(characterName, characterKey);

  // Check cache first
  if (talentsCache.has(key)) {
    return talentsCache.get(key);
  }

  // Load talent icon
  const loader = talentLoaders.get(key);
  if (!loader) {
    return undefined;
  }

  const talent = (await loader()).default;
  talentsCache.set(key, talent);
  evictOldest(talentsCache);
  return talent;
}

export async function getCharacterSkillIcon(
  characterName: string,
  skillName: string,
  characterKey?: string
): Promise<string | undefined> {
  const charKey = resolveAssetKey(characterName, characterKey);
  const skillKey = normalizeKey(skillName);

  // Check cache first
  if (!skillsCache.has(charKey)) {
    skillsCache.set(charKey, new Map());
  }
  const charSkills = skillsCache.get(charKey)!;

  if (charSkills.has(skillKey)) {
    return charSkills.get(skillKey);
  }

  // Load skill icon
  const loader = skillLoaders.get(charKey)?.get(skillKey);
  if (!loader) {
    return undefined;
  }

  const skill = (await loader()).default;
  charSkills.set(skillKey, skill);
  evictOldest(skillsCache);
  return skill;
}
