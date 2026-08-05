import { useMemo } from 'react';
import { getTodayAnswerSlug } from '../utils/daily-answer';

/** Deterministically picks today's answer from `pool`, namespaced by `modeSalt`. */
export function useDailyAnswer<T extends { slug: string }>(
  pool: T[],
  todayStr: string,
  modeSalt = '',
): T | null {
  return useMemo(() => {
    if (pool.length === 0) return null;
    const sortedSlugs = pool.map((c) => c.slug).sort();
    const answerSlug = getTodayAnswerSlug(todayStr, sortedSlugs, modeSalt);
    return pool.find((c) => c.slug === answerSlug) ?? null;
  }, [pool, todayStr, modeSalt]);
}
