export function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}
