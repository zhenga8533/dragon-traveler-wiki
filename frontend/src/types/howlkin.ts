import type { Quality } from './character';

export interface Howlkin {
  name: string;
  quality: Quality;
  basic_stats: Record<string, number>;
  passive_effects: string[];
  last_updated: number;
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
