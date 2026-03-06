export const CONTENT_TYPE_OPTIONS = ['All', 'PvP', 'PvE', 'Boss'] as const;

export type ContentType = (typeof CONTENT_TYPE_OPTIONS)[number];

export const DEFAULT_CONTENT_TYPE: ContentType = 'PvE';

const warnedInvalidContentTypes = new Set<string>();

function warnInvalidContentType(rawValue: string, fallback: ContentType): void {
  if (!import.meta.env.DEV) return;

  const warningKey = `${rawValue}=>${fallback}`;
  if (warnedInvalidContentTypes.has(warningKey)) return;
  warnedInvalidContentTypes.add(warningKey);

  console.warn(
    `[content-type] Invalid value "${rawValue}". Falling back to "${fallback}".`
  );
}

export function normalizeContentType(
  value: string | null | undefined,
  fallback: ContentType = DEFAULT_CONTENT_TYPE
): ContentType {
  const rawValue = (value || '').trim();
  const normalized = rawValue.toLowerCase();

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

  if (rawValue.length > 0) {
    warnInvalidContentType(rawValue, fallback);
  }

  return fallback;
}
