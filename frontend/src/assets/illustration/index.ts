const modules = import.meta.glob('./*.png', { eager: true, query: '?url', import: 'default' });

export const ILLUSTRATION_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const name = path.replace('./', '').replace('.png', '');
    return [name, url as string];
  })
);

export function getIllustration(characterName: string): string | undefined {
  const key = characterName.toLowerCase().replace(/\s+/g, '-');
  return ILLUSTRATION_MAP[key];
}
