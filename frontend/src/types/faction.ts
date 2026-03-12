// FACTION_NAMES is the canonical list of all factions.
// FactionName is derived from it so that adding a new faction here
// automatically flags every Record<FactionName, …> that is now incomplete.
export const FACTION_NAMES = [
  'Elemental Echo',
  'Wild Spirit',
  'Arcane Wisdom',
  'Sanctum Glory',
  'Otherworld Return',
  'Illusion Veil',
] as const;

export type FactionName = (typeof FACTION_NAMES)[number];

export type Wyrm =
  | 'Fire Whelp'
  | 'Butterfly Whelp'
  | 'Emerald Whelp'
  | 'Shadow Whelp'
  | 'Light Whelp'
  | 'Dark Whelp';

export interface Faction {
  name: FactionName;
  wyrm: Wyrm;
  description: string;
  recommended_artifacts: string[];
  last_updated: number;
}
