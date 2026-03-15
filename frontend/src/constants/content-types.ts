export const CONTENT_TYPE_OPTIONS = ['All', 'PvP', 'PvE', 'Boss'] as const;

export type ContentType = (typeof CONTENT_TYPE_OPTIONS)[number];

export const DEFAULT_CONTENT_TYPE: ContentType = 'PvE';

export const CONTENT_TYPE_COLOR: Record<ContentType, string> = {
  All: 'gray',
  PvP: 'red',
  PvE: 'teal',
  Boss: 'orange',
};

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

export function getContentTypeColor(
  value: string | null | undefined,
  fallback: ContentType = 'All'
): string {
  return CONTENT_TYPE_COLOR[normalizeContentType(value, fallback)];
}

export function normalizeContentTypeFilters(
  values: readonly string[] | null | undefined
): ContentType[] {
  if (!values || values.length === 0) return [];
  return [
    ...new Set(values.map((value) => normalizeContentType(value, 'All'))),
  ];
}

export function matchesContentTypeFilters(
  value: string | null | undefined,
  selectedFilters: readonly string[] | null | undefined
): boolean {
  const normalizedFilters = normalizeContentTypeFilters(selectedFilters);
  if (normalizedFilters.length === 0) {
    return true;
  }

  const normalizedValue = normalizeContentType(value, 'All');
  return normalizedFilters.includes(normalizedValue);
}
