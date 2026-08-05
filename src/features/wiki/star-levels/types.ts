export type StarTier = 'base' | 'purple' | 'red' | 'legendary' | 'divine';

export interface StarLevelEntry {
  stars: number;
  copies: number;
  fodder: number;
  divine_crystals: number;
}

export interface StarTierData {
  name: string;
  levels: StarLevelEntry[];
}

export interface StarLevel {
  label: string;
  stars: number;
  value: string;
  copies: number;
  fodder: number;
  divineCrystals: number;
  tier: StarTier;
}
