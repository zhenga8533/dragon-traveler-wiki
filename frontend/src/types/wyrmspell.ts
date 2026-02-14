import type { Quality } from './character';
import type { FactionName } from './faction';

export interface Wyrmspell {
  name: string;
  effect: string;
  type: string;
  quality: Quality;
  exclusive_faction: FactionName | null;
  is_global: boolean;
  last_updated: number;
}
