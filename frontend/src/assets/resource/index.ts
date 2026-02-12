// Dynamic imports for resource icons organised by category sub-folders
const iconModules = import.meta.glob<{ default: string }>('./**/*.png', {
  eager: true,
});

const icons = new Map<string, string>();

for (const [path, module] of Object.entries(iconModules)) {
  // Match e.g. ./currency/diamond.png -> "diamond"
  const match = path.match(/\.\/[^/]+\/(.+)\.png$/);
  if (match) {
    icons.set(match[1].toLowerCase(), module.default);
  }
}

export function getResourceIcon(name: string): string | undefined {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return icons.get(key);
}
