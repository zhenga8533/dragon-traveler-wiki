import type { SkillType } from '@/features/characters/types';

export interface AbilityAnswer {
  characterSlug: string;
  kind: 'talent' | 'skill';
  skillType?: SkillType;
  name: string;
}
