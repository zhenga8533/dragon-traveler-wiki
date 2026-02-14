import type { FactionName } from './faction';

export type Quality = 'UR' | 'SSR EX' | 'SSR+' | 'SSR' | 'SR+' | 'R' | 'N';

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
  last_updated: number;
}
