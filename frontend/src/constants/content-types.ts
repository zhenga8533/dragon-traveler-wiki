export const CONTENT_TYPE_OPTIONS = ['All', 'PvP', 'PvE', 'Boss'] as const;

export type ContentType = (typeof CONTENT_TYPE_OPTIONS)[number];

export const DEFAULT_CONTENT_TYPE: ContentType = 'PvE';

export function normalizeContentType(
  value: string | null | undefined,
  fallback: ContentType = DEFAULT_CONTENT_TYPE
): ContentType {
  const normalized = (value || '').trim().toLowerCase();

  if (normalized === 'all') return 'All';
  if (normalized === 'pvp' || normalized === 'arena' || normalized === 'duel')
    return 'PvP';
  if (
    normalized === 'pve' ||
    normalized === 'raid' ||
    normalized === 'tower' ||
    normalized === 'campaign'
  )
    return 'PvE';
  if (normalized === 'boss' || normalized === 'bosses') return 'Boss';

  return fallback;
}
