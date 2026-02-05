import type { CharacterClass } from '../../types/character';

import archer from './archer.png';
import assassin from './assassin.png';
import guardian from './guardian.png';
import mage from './mage.png';
import priest from './priest.png';
import warrior from './warrior.png';

export const CLASS_ICON_MAP: Record<CharacterClass, string> = {
  Guardian: guardian,
  Priest: priest,
  Assassin: assassin,
  Warrior: warrior,
  Archer: archer,
  Mage: mage,
};
