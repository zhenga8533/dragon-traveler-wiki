import { normalizeKey } from '../utils';

const iconModules = import.meta.glob<{ default: string }>('./**/*.png', {
  eager: true,
});

const gearIcons = new Map<string, string>();

for (const [path, module] of Object.entries(iconModules)) {
  const match = path.match(/\.\/([^/]+)\/(.+)\.png$/);
  if (!match) continue;
  const [, typeDir, fileName] = match;
  gearIcons.set(
    `${typeDir.toLowerCase()}/${fileName.toLowerCase()}`,
    module.default
  );
}

export function getGearIcon(type: string, name: string): string | undefined {
  const typeKey = normalizeKey(type);
  const nameKey = normalizeKey(name);
  return gearIcons.get(`${typeKey}/${nameKey}`);
}
