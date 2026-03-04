import { normalizeKey } from '../utils';

// Dynamic imports for status effect icons in type subdirectories
const iconModules = import.meta.glob<{ default: string }>('./**/*.png', {
  eager: true,
});

const icons = new Map<string, string>();

for (const [path, module] of Object.entries(iconModules)) {
  // Match e.g. ./buff/attack_boost.png → attack_boost
  const match = path.match(/\.\/[^/]+\/(.+)\.png$/);
  if (match) {
    icons.set(normalizeKey(match[1]), module.default);
  }
}

export function getStatusEffectIcon(name: string): string | undefined {
  const key = normalizeKey(name);
  return icons.get(key);
}
