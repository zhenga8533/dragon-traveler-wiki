import { normalizeKey } from '../utils';

const iconModules = import.meta.glob<{ default: string }>('./**/*.png', {
  eager: true,
});

const icons = new Map<string, string>();

for (const [path, module] of Object.entries(iconModules)) {
  const match = path.match(/\/([^/]+)\.png$/);
  if (match) {
    icons.set(match[1].toLowerCase(), module.default);
  }
}

export function getHowlkinIcon(name: string): string | undefined {
  const key = normalizeKey(name);
  return icons.get(key);
}
