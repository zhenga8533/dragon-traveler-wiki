import { STORAGE_KEY } from '@/constants/ui';
import { readStoredJson, writeStoredJson } from '@/utils/saved-storage';

const MAX_RECENT_SEARCHES = 5;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export function loadRecentSearches(): string[] {
  return readStoredJson(STORAGE_KEY.RECENT_SEARCHES, [], isStringArray);
}

export function saveRecentSearch(query: string, previous: string[]): string[] {
  const trimmed = query.trim();
  if (!trimmed) return previous;

  const next = [trimmed, ...previous.filter((item) => item !== trimmed)].slice(
    0,
    MAX_RECENT_SEARCHES,
  );
  writeStoredJson(STORAGE_KEY.RECENT_SEARCHES, next);
  return next;
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY.RECENT_SEARCHES);
  } catch {
    // Storage is optional; the in-memory search state is still cleared.
  }
}
