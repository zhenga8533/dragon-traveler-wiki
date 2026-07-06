import type { Character, SkillType } from '@/features/characters/types';
import { fnv1aHash32 } from '../../utils/ring-hash';
import { getEligibleCharacters } from '../../utils/daily-answer';
import type { AbilityAnswer } from './types';

export const SKILL_TYPES: SkillType[] = [
  'Overdrive',
  'Ultimate Skill',
  'Secret Skill',
  'Special Skill',
];

/** R+ characters all qualify: every character has a talent and at least 2 skills. */
export function getAbilityEligibleCharacters(characters: Character[]): Character[] {
  return getEligibleCharacters(characters);
}

/**
 * Deterministically picks which of a character's abilities (talent, or one
 * of their existing skills — divinity is excluded) is today's answer.
 */
export function pickDailyAbility(
  character: Character,
  dateStr: string
): AbilityAnswer {
  const pool: AbilityAnswer[] = [];

  if (character.talent) {
    pool.push({
      characterSlug: character.slug,
      kind: 'talent',
      name: character.talent.name,
    });
  }
  for (const skill of character.skills) {
    pool.push({
      characterSlug: character.slug,
      kind: 'skill',
      skillType: skill.type,
      name: skill.name,
    });
  }

  const index =
    fnv1aHash32(`${dateStr}:ability-slot:${character.slug}`) % pool.length;
  return pool[index];
}
