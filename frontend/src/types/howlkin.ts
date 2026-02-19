import type { Quality } from './character';

export interface Howlkin {
  name: string;
  quality: Quality;
  basic_stats: Record<string, number>;
  passive_effect: string;
  last_updated: number;
}
