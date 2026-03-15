import type { CharacterClass } from '@/features/characters/types';

export const CLASS_ORDER: CharacterClass[] = [
  'Guardian',
  'Priest',
  'Assassin',
  'Warrior',
  'Archer',
  'Mage',
];

export const CLASS_COLOR: Record<CharacterClass, string> = {
  Guardian: 'blue',
  Priest: 'teal',
  Assassin: 'grape',
  Warrior: 'red',
  Archer: 'orange',
  Mage: 'violet',
};
