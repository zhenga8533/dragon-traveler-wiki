import { normalizeKey } from '../utils';

// Dynamic imports for status effect icons
const iconModules = import.meta.glob<{ default: string }>(
  './*.png',
  { eager: true }
);

// Build lookup map
const icons = new Map<string, string>();

for (const [path, module] of Object.entries(iconModules)) {
  // path is like "./attack_boost.png"
  const match = path.match(/\.\/(.+)\.png$/);
  if (match) {
    icons.set(match[1], module.default);
  }
}

export function getStatusEffectIcon(name: string): string | undefined {
  const key = normalizeKey(name);
  return icons.get(key);
}
