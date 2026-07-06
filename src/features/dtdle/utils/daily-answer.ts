import type { Character } from '@/features/characters/types';
import { buildRing, fnv1aHash32, pickFromRing } from './ring-hash';

const EXCLUDED_QUALITIES = new Set(['N', 'C']);
const LOOKBACK_DAYS = 14;
const MS_PER_DAY = 86_400_000;

/** Characters eligible to be a daily answer: quality "R" or better. */
export function getEligibleCharacters(characters: Character[]): Character[] {
  return characters.filter((c) => !EXCLUDED_QUALITIES.has(c.quality));
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** UTC-based date math, safe for any positive or negative day offset. */
export function addDaysIso(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCMilliseconds(date.getUTCMilliseconds() + days * MS_PER_DAY);
  return date.toISOString().slice(0, 10);
}

export function pickForDate(
  dateStr: string,
  ring: ReturnType<typeof buildRing>,
  excludedSlugs: ReadonlySet<string>
): string {
  const dateHash = fnv1aHash32(dateStr);
  return pickFromRing(ring, dateHash, excludedSlugs);
}

/**
 * Derives today's answer with no stored schedule: replays the trailing
 * `LOOKBACK_DAYS` window forward-in-time so each day's exclusion set is
 * built the same deterministic way, then applies the same rule to today.
 */
export function getTodayAnswerSlug(
  todayStr: string,
  eligibleSlugsSorted: string[]
): string {
  const ring = buildRing(eligibleSlugsSorted);
  const history: string[] = [];

  for (let d = LOOKBACK_DAYS; d >= 1; d--) {
    const dayStr = addDaysIso(todayStr, -d);
    const excluded = new Set(history.slice(-LOOKBACK_DAYS));
    history.push(pickForDate(dayStr, ring, excluded));
  }

  const excluded = new Set(history.slice(-LOOKBACK_DAYS));
  return pickForDate(todayStr, ring, excluded);
}
