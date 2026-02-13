import type { FactionName } from '../../types/faction';
import butterflyWhelp from './butterfly_whelp.png';
import darkWhelp from './dark_whelp.png';
import emeraldWhelp from './emerald_whelp.png';
import fireWhelp from './fire_whelp.png';
import lightWhelp from './light_whelp.png';
import shadowWhelp from './shadow_whelp.png';

export const FACTION_WYRM_MAP: Record<FactionName, string> = {
  'Elemental Echo': fireWhelp,
  'Wild Spirit': emeraldWhelp,
  'Arcane Wisdom': butterflyWhelp,
  'Sanctum Glory': lightWhelp,
  'Otherworld Return': shadowWhelp,
  'Illusion Veil': darkWhelp,
};
