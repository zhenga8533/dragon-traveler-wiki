import type { FactionName } from '../../types/faction';
import arcaneWisdom from './arcane_wisdom.png';
import elementalEcho from './elemental_echo.png';
import illusionVeil from './illusion_veil.png';
import otherworldReturn from './otherworld_return.png';
import sanctumGlory from './sanctum_glory.png';
import wildSpirit from './wild_spirit.png';

export const FACTION_ICON_MAP: Record<FactionName, string> = {
  'Elemental Echo': elementalEcho,
  'Wild Spirit': wildSpirit,
  'Arcane Wisdom': arcaneWisdom,
  'Sanctum Glory': sanctumGlory,
  'Otherworld Return': otherworldReturn,
  'Illusion Veil': illusionVeil,
};
