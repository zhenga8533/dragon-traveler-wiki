import type { TierDefinition } from '@/features/tier-list/types';

export const TIER_ORDER: string[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

export const TIER_COLOR: Record<string, string> = {
  'S+': 'pink',
  S: 'red',
  A: 'orange',
  B: 'yellow',
  C: 'green',
  D: 'gray',
};

const CUSTOM_TIER_COLOR_CYCLE = [
  'blue',
  'teal',
  'violet',
  'grape',
  'indigo',
  'cyan',
  'lime',
  'orange',
  'pink',
];

/** Returns a Mantine color for a tier, cycling through a palette for custom tiers. */
export function getTierColor(tier: string, index = 0): string {
  return (
    TIER_COLOR[tier] ??
    CUSTOM_TIER_COLOR_CYCLE[index % CUSTOM_TIER_COLOR_CYCLE.length]
  );
}

/** Default tier definitions used when a tier list has no custom tiers. */
export const DEFAULT_TIER_DEFINITIONS: TierDefinition[] = [
  { name: 'S+' },
  { name: 'S' },
  { name: 'A' },
  { name: 'B' },
  { name: 'C' },
  { name: 'D' },
];
