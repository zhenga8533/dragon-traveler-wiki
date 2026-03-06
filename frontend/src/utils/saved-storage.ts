/**
 * Generic utility for loading and normalizing saved items from localStorage.
 * Handles missing `last_updated` timestamps by backfilling them.
 */
export function loadSavedFromStorage<T extends { last_updated?: number }>(
  storageKey: string,
  isValid: (value: Partial<T>) => boolean
): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    let changed = false;
    const items: T[] = [];
    for (const [key, value] of Object.entries(parsed)) {
      if (value === null || typeof value !== 'object') continue;
      const maybe = value as Partial<T>;
      if (!isValid(maybe)) continue;
      if ((maybe.last_updated ?? 0) > 0) {
        items.push(maybe as T);
        continue;
      }
      changed = true;
      const normalized = { ...(maybe as T), last_updated: now };
      parsed[key] = normalized;
      items.push(normalized);
    }
    items.sort((a, b) => (b.last_updated ?? 0) - (a.last_updated ?? 0));
    if (changed) {
      window.localStorage.setItem(storageKey, JSON.stringify(parsed));
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * Parses the URL-based tab mode for pages with view/saved/builder tabs.
 */
export function parseTabMode(
  raw: string | null
): 'view' | 'saved' | 'builder' {
  if (raw === 'saved' || raw === 'builder') return raw;
  return 'view';
}
