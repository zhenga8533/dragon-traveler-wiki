import type { StarTier } from '@/features/wiki/star-levels/types';

export const STAR_TIER_BADGE_COLORS: Record<StarTier, string> = {
  base: 'gray',
  purple: 'grape',
  red: 'red',
  legendary: 'cyan',
  divine: 'orange',
};

export const HEART_TRIAL_RATES = {
  'SSR EX': 1,
  'SSR+': 3,
  SSR: 6,
  SR: 15,
} as const;

export const SHARDS_PER_DUPE = 60;

export type HeartTrialQuality = keyof typeof HEART_TRIAL_RATES;

export function getHeartTrialShardsPerDay(
  quality: HeartTrialQuality,
  affectionLevel20: boolean,
): number {
  return quality === 'SSR EX' && affectionLevel20
    ? 2
    : HEART_TRIAL_RATES[quality];
}
