export function readStoredJson<T>(
  storageKey: string,
  fallback: T,
  isValid: (value: unknown) => value is T
): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredJson<T>(storageKey: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readStoredStringSet(storageKey: string): Set<string> {
  const values = readStoredJson(
    storageKey,
    [] as string[],
    (value): value is string[] =>
      Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
  return new Set(values);
}

export function writeStoredStringSet(
  storageKey: string,
  values: Set<string>
): boolean {
  return writeStoredJson(storageKey, [...values]);
}

/**
 * Generic utility for loading and normalizing saved items from localStorage.
 * Handles missing `last_updated` timestamps by backfilling them.
 *
 * Pass an optional `migrate` callback to upgrade items that were stored in a
 * legacy format. Migrated items are written back so the conversion runs once.
 */
export function loadSavedFromStorage<T extends { last_updated?: number }>(
  storageKey: string,
  isValid: (value: Partial<T>) => boolean,
  migrate?: (value: Partial<T>) => T
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

      // Run migration if provided — always write result back so it only runs once
      const item = migrate ? migrate(maybe) : (maybe as T);
      if (migrate) {
        parsed[key] = item;
        changed = true;
      }

      if ((item.last_updated ?? 0) <= 0) {
        item.last_updated = now;
        parsed[key] = item;
        changed = true;
      }

      items.push(item);
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
