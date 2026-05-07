import type { Quality } from '@/types/quality';

export type HowlkinBasicStats = Record<string, number | string>;

export interface Howlkin {
  name: string;
  quality: Quality;
  basic_stats: HowlkinBasicStats;
  passive_effects: string[];
  last_updated?: number | null;
}

export interface GoldenAllianceEffect {
  level: number;
  stats: string[];
}

export interface GoldenAlliance {
  name: string;
  howlkins: string[];
  effects: GoldenAllianceEffect[];
  last_updated?: number;
}
