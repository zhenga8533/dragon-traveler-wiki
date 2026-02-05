// Dynamic imports for subclass icons
// Images are organized in subdirectories by character class (e.g., archer/, assassin/)
const modules = import.meta.glob<{ default: string }>('./**/*.png', {
  eager: true,
});

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

// Build lookup map: class/subclass -> image path
const icons = new Map<string, string>();

for (const [path, module] of Object.entries(modules)) {
  // path is like "./archer/tracker.png" or "./assassin/thief.png"
  const match = path.match(/\.\/([^/]+)\/([^/]+)\.png$/);
  if (match) {
    const [, characterClass, subclassFile] = match;
    // Store with both the full class/subclass key and just the subclass key
    const fullKey = `${characterClass}/${subclassFile}`;
    icons.set(fullKey, module.default);
    // Also store by subclass alone for backwards compatibility
    icons.set(subclassFile, module.default);
  }
}

export function getSubclassIcon(
  subclassName: string,
  characterClass?: string
): string | undefined {
  const subclassKey = normalizeKey(subclassName);

  // Try with character class first if provided
  if (characterClass) {
    const classKey = normalizeKey(characterClass);
    const fullKey = `${classKey}/${subclassKey}`;
    const result = icons.get(fullKey);
    if (result) return result;
  }

  // Fall back to just subclass name
  return icons.get(subclassKey);
}
