import type { FactionName } from '@/types/faction';
import type { Quality } from '@/types/quality';

export type WyrmPhase = 'Juvenile Phase' | 'Growth Phase' | 'Final Phase';

export const WYRM_PHASE_ORDER: WyrmPhase[] = [
  'Juvenile Phase',
  'Growth Phase',
  'Final Phase',
];

export interface WyrmSkill {
  name: string;
  description: string;
}

export interface WyrmStarUpgrade {
  star: number;
  description: string;
}

export interface Wyrm {
  slug: string;
  name: string;
  faction: FactionName;
  phase: WyrmPhase;
  quality: Quality;
  description: string;
  battle_description: string;
  evolves_from: string | null;
  evolves_to: string | null;
  skills: WyrmSkill[];
  star_upgrades: WyrmStarUpgrade[];
  last_updated: number;
}
