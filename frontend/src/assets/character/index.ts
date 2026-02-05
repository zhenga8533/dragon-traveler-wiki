// Dynamic imports for character assets
const portraitModules = import.meta.glob<{ default: string }>(
  './**/portrait.png',
  { eager: true }
);

const illustrationModules = import.meta.glob<{ default: string }>(
  './**/illustrations/*.png',
  { eager: true }
);

const talentModules = import.meta.glob<{ default: string }>('./**/talent.png', {
  eager: true,
});

const skillModules = import.meta.glob<{ default: string }>(
  './**/skills/*.png',
  { eager: true }
);

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

export interface CharacterIllustration {
  name: string;
  src: string;
}

// Build lookup maps
const portraits = new Map<string, string>();
const illustrations = new Map<string, CharacterIllustration[]>();
const talents = new Map<string, string>();
const skills = new Map<string, Map<string, string>>();

for (const [path, module] of Object.entries(portraitModules)) {
  // path is like "./fenrir/portrait.png"
  const match = path.match(/\.\/([^/]+)\/portrait\.png$/);
  if (match) {
    portraits.set(match[1], module.default);
  }
}

for (const [path, module] of Object.entries(illustrationModules)) {
  // path is like "./fenrir/illustrations/default.png"
  const match = path.match(/\.\/([^/]+)\/illustrations\/([^/]+)\.png$/);
  if (match) {
    const [, charKey, illustrationName] = match;
    if (!illustrations.has(charKey)) {
      illustrations.set(charKey, []);
    }
    illustrations.get(charKey)!.push({
      name: illustrationName.replace(/-/g, ' '),
      src: module.default,
    });
  }
}

for (const [path, module] of Object.entries(talentModules)) {
  // path is like "./fenrir/talent.png"
  const match = path.match(/\.\/([^/]+)\/talent\.png$/);
  if (match) {
    talents.set(match[1], module.default);
  }
}

for (const [path, module] of Object.entries(skillModules)) {
  // path is like "./fenrir/skills/skill-name.png"
  const match = path.match(/\.\/([^/]+)\/skills\/([^/]+)\.png$/);
  if (match) {
    const [, charKey, skillName] = match;
    if (!skills.has(charKey)) {
      skills.set(charKey, new Map());
    }
    skills.get(charKey)!.set(skillName, module.default);
  }
}

export function getPortrait(characterName: string): string | undefined {
  const key = normalizeKey(characterName);
  return portraits.get(key);
}

export function getIllustrations(
  characterName: string
): CharacterIllustration[] {
  const key = normalizeKey(characterName);
  return illustrations.get(key) || [];
}

// For backwards compatibility - returns first illustration
export function getIllustration(characterName: string): string | undefined {
  const list = getIllustrations(characterName);
  return list.length > 0 ? list[0].src : undefined;
}

export function getTalentIcon(characterName: string): string | undefined {
  const key = normalizeKey(characterName);
  return talents.get(key);
}

export function getCharacterSkillIcon(
  characterName: string,
  skillName: string
): string | undefined {
  const charKey = normalizeKey(characterName);
  const skillKey = normalizeKey(skillName);
  return skills.get(charKey)?.get(skillKey);
}
