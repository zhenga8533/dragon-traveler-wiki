export type FactionName =
  | "Elemental Echo"
  | "Wild Spirit"
  | "Arcane Wisdom"
  | "Sanctum Glory"
  | "Otherworld Return"
  | "Illusion Veil";

export type Wyrm =
  | "Fire Whelp"
  | "Butterfly Whelp"
  | "Emerald Whelp"
  | "Shadow Whelp"
  | "Light Whelp"
  | "Dark Whelp";

export interface Faction {
  name: FactionName;
  wyrm: Wyrm;
  description: string;
  last_updated: number;
}
