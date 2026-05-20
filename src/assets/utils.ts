export function normalizeKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\+/g, '_plus')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeQualityKey(quality: string): string {
  const normalized = normalizeKey(quality);
  return normalized === 'ssr' && quality.includes('+') ? 'ssr_plus' : normalized;
}
