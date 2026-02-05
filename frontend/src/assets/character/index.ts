// Dynamic imports for character assets
// Portraits load immediately (needed for character lists)
const portraitModules = import.meta.glob<{ default: string }>(
  './**/portrait.png',
  { eager: true }
);

// Illustrations, talents, and skills load on-demand (only needed on character detail pages)
const illustrationModules = import.meta.glob<{ default: string }>(
  './**/illustrations/*.png'
);

const talentModules = import.meta.glob<{ default: string }>('./**/talent.png');

const skillModules = import.meta.glob<{ default: string }>('./**/skills/*.png');

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

export interface CharacterIllustration {
  name: string;
  src: string;
}

// Build lookup maps
const portraits = new Map<string, string>();
const illustrationLoaders = new Map<
  string,
  Array<{ name: string; loader: () => Promise<{ default: string }> }>
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
    portraits.set(match[1], module.default);
  }
}

// Build illustration loaders map (lazy loading)
for (const [path, loader] of Object.entries(illustrationModules)) {
  // path is like "./fenrir/illustrations/default.png"
  const match = path.match(/\.\/([^/]+)\/illustrations\/([^/]+)\.png$/);
  if (match) {
    const [, charKey, illustrationName] = match;
    if (!illustrationLoaders.has(charKey)) {
      illustrationLoaders.set(charKey, []);
    }
    illustrationLoaders.get(charKey)!.push({
      name: illustrationName.replace(/-/g, ' '),
      loader: loader as () => Promise<{ default: string }>,
    });
  }
}

// Build talent loaders map (lazy loading)
for (const [path, loader] of Object.entries(talentModules)) {
  // path is like "./fenrir/talent.png"
  const match = path.match(/\.\/([^/]+)\/talent\.png$/);
  if (match) {
    talentLoaders.set(match[1], loader as () => Promise<{ default: string }>);
  }
}

// Build skill loaders map (lazy loading)
for (const [path, loader] of Object.entries(skillModules)) {
  // path is like "./fenrir/skills/skill-name.png"
  const match = path.match(/\.\/([^/]+)\/skills\/([^/]+)\.png$/);
  if (match) {
    const [, charKey, skillName] = match;
    if (!skillLoaders.has(charKey)) {
      skillLoaders.set(charKey, new Map());
    }
    skillLoaders
      .get(charKey)!
      .set(skillName, loader as () => Promise<{ default: string }>);
  }
}

export function getPortrait(characterName: string): string | undefined {
  const key = normalizeKey(characterName);
  return portraits.get(key);
}

export async function getIllustrations(
  characterName: string
): Promise<CharacterIllustration[]> {
  const key = normalizeKey(characterName);

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
    loaders.map(async ({ name, loader }) => ({
      name,
      src: (await loader()).default,
    }))
  );

  // Cache the results
  illustrationsCache.set(key, illustrations);
  return illustrations;
}

// For backwards compatibility - returns first illustration
export async function getIllustration(
  characterName: string
): Promise<string | undefined> {
  const list = await getIllustrations(characterName);
  return list.length > 0 ? list[0].src : undefined;
}

export async function getTalentIcon(
  characterName: string
): Promise<string | undefined> {
  const key = normalizeKey(characterName);

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
  return talent;
}

export async function getCharacterSkillIcon(
  characterName: string,
  skillName: string
): Promise<string | undefined> {
  const charKey = normalizeKey(characterName);
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
  return skill;
}
