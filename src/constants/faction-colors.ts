import { FACTION_NAMES, FACTION_SLUGS, type FactionSlug } from '@/types/faction';

export { FACTION_NAMES, FACTION_SLUGS };

export const FACTION_COLOR: Record<FactionSlug, string> = {
  elemental_echo: 'red',
  wild_spirit: 'green',
  arcane_wisdom: 'blue',
  sanctum_glory: 'yellow',
  otherworld_return: 'violet',
  illusion_veil: 'dark',
};
