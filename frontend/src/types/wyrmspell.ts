import type { FactionName } from './faction';
import type { Quality } from './quality';

export type WyrmspellType = 'Breach' | 'Refuge' | 'Wildcry' | "Dragon's Call";

export interface Wyrmspell {
  name: string;
  effect: string;
  type: WyrmspellType;
  quality: Quality;
  exclusive_faction: FactionName | null;
  is_global: boolean;
  last_updated: number;
}
