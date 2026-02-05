// Dynamic imports for character assets
const portraitModules = import.meta.glob<{ default: string }>(
  './**/portrait.png',
  { eager: true }
);

const illustrationModules = import.meta.glob<{ default: string }>(
  './**/illustrations/*.png',
  { eager: true }
);

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export interface CharacterIllustration {
  name: string;
  src: string;
}

// Build lookup maps
const portraits = new Map<string, string>();
const illustrations = new Map<string, CharacterIllustration[]>();

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

export function getPortrait(characterName: string): string | undefined {
  const key = normalizeKey(characterName);
  return portraits.get(key);
}

export function getIllustrations(characterName: string): CharacterIllustration[] {
  const key = normalizeKey(characterName);
  return illustrations.get(key) || [];
}

// For backwards compatibility - returns first illustration
export function getIllustration(characterName: string): string | undefined {
  const list = getIllustrations(characterName);
  return list.length > 0 ? list[0].src : undefined;
}
