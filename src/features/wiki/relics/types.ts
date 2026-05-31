import type { Quality } from '@/types/quality';

export type RelicType =
  | 'Sanctuary Relic'
  | 'Legendary Ritual Vessel'
  | 'Fated Relic'
  | 'Symbol of Theocracy';

export interface Relic {
  name: string;
  oracle_scroll?: string | null;
  lore: string;
  type: RelicType;
  quality: Quality;
  last_updated?: number;
}
