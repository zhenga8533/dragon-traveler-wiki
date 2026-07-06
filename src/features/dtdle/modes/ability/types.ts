import type { SkillType } from '@/features/characters/types';

export interface AbilityAnswer {
  characterSlug: string;
  kind: 'talent' | 'skill';
  skillType?: SkillType;
  name: string;
}

export interface AbilityGameState {
  date: string;
  guessedSlugs: string[];
  characterSolved: boolean;
  categoryGuesses: SkillType[];
  solved: boolean;
}
