import { CLASS_ORDER } from '@/constants/colors';
import type { CharacterClass } from '@/features/characters/types';

const FALLBACK_RANK = 999;

export const getClassRank = (value: CharacterClass): number => {
  const index = CLASS_ORDER.indexOf(value);
  return index === -1 ? FALLBACK_RANK : index;
};
