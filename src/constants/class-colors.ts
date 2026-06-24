import type { CharacterClass } from '@/features/characters/types';

export const CLASS_ORDER: CharacterClass[] = [
  'guardian',
  'priest',
  'assassin',
  'warrior',
  'archer',
  'mage',
];

export const CLASS_COLOR: Record<CharacterClass, string> = {
  guardian: 'blue',
  priest: 'teal',
  assassin: 'grape',
  warrior: 'red',
  archer: 'orange',
  mage: 'violet',
};
