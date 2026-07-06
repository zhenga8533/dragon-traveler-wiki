import type { FactionSlug } from '@/types/faction';
import type { GearSetBonus, GearType } from '@/features/wiki/gear/types';
import type { Quality } from '@/types/quality';

export type CharacterClass =
  | 'guardian'
  | 'priest'
  | 'assassin'
  | 'warrior'
  | 'archer'
  | 'mage';

export type SkillType =
  | 'Overdrive'
  | 'Ultimate Skill'
  | 'Secret Skill'
  | 'Special Skill';

export interface Skill {
  name: string;
  type?: SkillType;
  description: string;
  cooldown: number | string;
  cost?: number | null;
}

export interface DivinityChoice {
  name: string;
  description: string;
  cooldown: number;
}

export interface DivinityLevel {
  level: number;
  choices: DivinityChoice[];
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

export interface RecommendedGearSlots {
  headgear?: string | null;
  chestplate?: string | null;
  bracers?: string | null;
  boots?: string | null;
  weapon?: string | null;
  accessory?: string | null;
}

export interface RecommendedGearLoadout {
  label: string;
  description: string;
  slots: RecommendedGearSlots;
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
  setDisplayName: string | null;
  setBonus: GearSetBonus | null;
  quality: string | undefined;
  lore: string | undefined;
  stats: Record<string, string | number> | undefined;
};

export interface ActivatedSetBonus {
  setName: string;
  setDisplayName: string | null;
  pieces: number;
  requiredPieces: number;
  description: string;
  activations: number;
}

export interface RecommendedGearLoadoutData {
  loadout: RecommendedGearLoadout;
  details: RecommendedGearDetail[];
  activatedSetBonuses: ActivatedSetBonus[];
}

export interface CharacterIllustrationEntry {
  name: string;
  file: string;
  type: 'image' | 'video';
}

export interface Character {
  slug: string;
  name: string;
  title: string;
  quality: Quality;
  character_class: CharacterClass;
  factions: FactionSlug[];
  is_global: boolean;
  subclasses: string[];
  height: string;
  weight: string;
  lore: string | string[];
  quote: string;
  ssr_quote?: string;
  origin: string;
  summary?: string;
  talent?: Talent | null;
  skills: Skill[];
  divinity?: DivinityLevel[];
  recommended_noble_phantasm: string;
  recommended_gear?: RecommendedGearLoadout[] | null;
  recommended_subclasses?: string[];
  illustrations?: CharacterIllustrationEntry[];
  last_updated: number;
}
