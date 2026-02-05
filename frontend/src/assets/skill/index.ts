// Dynamic imports for skill icons
const modules = import.meta.glob<{ default: string }>(
  './*.png',
  { eager: true }
);

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// Build lookup map
const icons = new Map<string, string>();

for (const [path, module] of Object.entries(modules)) {
  // path is like "./fireball.png"
  const match = path.match(/\.\/([^/]+)\.png$/);
  if (match) {
    icons.set(match[1], module.default);
  }
}

export function getSkillIcon(skillName: string): string | undefined {
  const key = normalizeKey(skillName);
  return icons.get(key);
}
