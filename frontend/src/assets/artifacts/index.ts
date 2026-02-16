import { normalizeKey } from '../utils';

// Eager-load artifact icons (artifact.png per artifact folder)
const artifactModules = import.meta.glob<{ default: string }>(
  './**/artifact.png',
  { eager: true }
);

// Eager-load treasure icons (treasures/*.png per artifact folder)
const treasureModules = import.meta.glob<{ default: string }>(
  './**/treasures/*.png',
  { eager: true }
);

const artifactIcons = new Map<string, string>();
const treasureIcons = new Map<string, string>();

for (const [path, module] of Object.entries(artifactModules)) {
  // path is like "./sisyphus_monolith/artifact.png"
  const match = path.match(/\.\/([^/]+)\/artifact\.png$/);
  if (match) {
    artifactIcons.set(match[1], module.default);
  }
}

for (const [path, module] of Object.entries(treasureModules)) {
  // path is like "./sisyphus_monolith/treasures/underworld_offering.png"
  const match = path.match(/\.\/([^/]+)\/treasures\/([^/]+)\.png$/);
  if (match) {
    const [, artifactKey, treasureKey] = match;
    treasureIcons.set(`${artifactKey}/${treasureKey}`, module.default);
  }
}

export function getArtifactIcon(name: string): string | undefined {
  const key = normalizeKey(name);
  return artifactIcons.get(key);
}

export function getTreasureIcon(
  artifactName: string,
  treasureName: string
): string | undefined {
  const artifactKey = normalizeKey(artifactName);
  const treasureKey = normalizeKey(treasureName);
  return treasureIcons.get(`${artifactKey}/${treasureKey}`);
}
