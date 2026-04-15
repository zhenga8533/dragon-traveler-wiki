export function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Convert a display name or route segment to a canonical entity slug.
 * Example: "Vermilion Bird" -> "vermilion_bird"
 *
 * Pass `{ allowPlus: true }` to preserve `+` characters (e.g. for quality
 * suffixes like "SSR+" → "ssr+").
 */
export function toEntitySlug(
  value: string,
  { allowPlus = false }: { allowPlus?: boolean } = {}
): string {
  const charPattern = allowPlus ? /[^a-z0-9_+]/g : /[^a-z0-9_]/g;
  return safeDecodeURIComponent(value)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(charPattern, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function findEntityByParam<T>(
  items: T[],
  param: string | undefined,
  getName: (item: T) => string
): T | null {
  if (!param) return null;
  const slug = toEntitySlug(param);
  return items.find((item) => toEntitySlug(getName(item)) === slug) ?? null;
}

export function shouldRedirectToEntitySlug(
  param: string | undefined,
  entityName: string | undefined
): boolean {
  if (!param || !entityName) return false;
  const incoming = safeDecodeURIComponent(param).trim();
  const canonical = toEntitySlug(entityName);
  return incoming !== canonical;
}
