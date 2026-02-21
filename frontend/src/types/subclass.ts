import type { CharacterClass } from './character';

export interface Subclass {
  name: string;
  class: CharacterClass;
  tier: number;
  bonuses: string[];
  effect: string;
  last_updated: number;
}
