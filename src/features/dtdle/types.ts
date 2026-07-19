import type { SkillType } from '@/features/characters/types';

export interface AbilityGameState {
  date: string;
  guessedSlugs: string[];
  characterSolved: boolean;
  categoryGuesses: SkillType[];
  solved: boolean;
}

export interface GuessComparison {
  classStatus: 'exact' | 'none';
  qualityStatus: 'exact' | 'higher' | 'lower';
  factionStatus: 'exact' | 'partial' | 'none';
  originStatus: 'exact' | 'none';
  heightStatus: 'exact' | 'higher' | 'lower' | 'unknown';
  weightStatus: 'exact' | 'higher' | 'lower' | 'unknown';
}

export interface DtdleGameState {
  date: string;
  guessedSlugs: string[];
  solved: boolean;
}

export interface IllustrationGameState {
  date: string;
  guessedSlugs: string[];
  characterSolved: boolean;
  guessedSkinSlugs: string[];
  solved: boolean;
}

export interface DtdleStats {
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  lastPlayedDate: string | null;
}
