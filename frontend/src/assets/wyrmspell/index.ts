import { normalizeKey } from '../utils';

// Dynamic imports for wyrmspell icons in type subdirectories
const iconModules = import.meta.glob<{ default: string }>('./**/*.png', {
  eager: true,
});

const icons = new Map<string, string>();

for (const [path, module] of Object.entries(iconModules)) {
  // Match e.g. ./breach/attack_aura.png → attack_aura
  const match = path.match(/\.\/[^/]+\/(.+)\.png$/);
  if (match) {
    icons.set(match[1], module.default);
  }
}

export function getWyrmspellIcon(name: string): string | undefined {
  const key = normalizeKey(name);
  return icons.get(key);
}
