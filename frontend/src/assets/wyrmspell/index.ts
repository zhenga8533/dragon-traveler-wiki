// Dynamic imports for wyrmspell icons
const iconModules = import.meta.glob<{ default: string }>('./*.png', {
  eager: true,
});

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

const icons = new Map<string, string>();

for (const [path, module] of Object.entries(iconModules)) {
  const match = path.match(/\.\/(.+)\.png$/);
  if (match) {
    icons.set(match[1], module.default);
  }
}

export function getWyrmspellIcon(name: string): string | undefined {
  const key = normalizeKey(name);
  return icons.get(key);
}
