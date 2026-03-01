import type { FactionName } from './faction';
import type { GearSetBonus, GearType } from './gear';
import type { Quality } from './quality';

export type CharacterClass =
  | 'Guardian'
  | 'Priest'
  | 'Assassin'
  | 'Warrior'
  | 'Archer'
  | 'Mage';

export type SkillType =
  | 'Overdrive'
  | 'Ultimate Skill'
  | 'Secret Skill'
  | 'Special Skill'
  | 'Divine Skill';

export interface Skill {
  name: string;
  type?: SkillType;
  description: string;
  cooldown: number;
}

export interface TalentLevel {
  level: number;
  effect: string;
}

export interface Talent {
  name: string;
  talent_levels: TalentLevel[];
}

export type RecommendedGearSlot =
  | 'headgear'
  | 'chestplate'
  | 'bracers'
  | 'boots'
  | 'weapon'
  | 'accessory';

export interface RecommendedGear {
  headgear?: string;
  chestplate?: string;
  bracers?: string;
  boots?: string;
  weapon?: string;
  accessory?: string;
}

export interface RecommendedGearEntry {
  slot: RecommendedGearSlot;
  type: GearType;
  name: string;
}

export interface RecommendedSubclassEntry {
  name: string;
  icon: string | undefined;
  tier: number | undefined;
  className: string | undefined;
  bonuses: string[];
  effect: string | undefined;
}

export type RecommendedGearDetail = RecommendedGearEntry & {
  label: string;
  icon: string;
  slotIcon: string;
  setName: string | null;
  setBonus: GearSetBonus | null;
  quality: string | undefined;
  lore: string | undefined;
  stats: Record<string, string | number> | undefined;
};

export interface ActivatedSetBonus {
  setName: string;
  pieces: number;
  requiredPieces: number;
  description: string;
  activations: number;
}

export interface Character {
  name: string;
  title: string;
  quality: Quality;
  character_class: CharacterClass;
  factions: FactionName[];
  is_global: boolean;
  subclasses: string[];
  height: string;
  weight: string;
  lore: string;
  quote: string;
  origin: string;
  talent?: Talent | null;
  skills: Skill[];
  noble_phantasm: string;
  recommended_gear?: RecommendedGear | null;
  recommended_subclasses?: string[];
  last_updated: number;
}
