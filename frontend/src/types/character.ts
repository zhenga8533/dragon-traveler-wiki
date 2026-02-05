export type Quality = "SSR EX" | "SSR+" | "SSR" | "SR+" | "R" | "N";

export type CharacterClass =
  | "Guardian"
  | "Priest"
  | "Assassin"
  | "Warrior"
  | "Archer"
  | "Mage";

export type Faction =
  | "Elemental Echo"
  | "Wild Spirit"
  | "Arcane Wisdom"
  | "Sanctum Glory"
  | "Otherworld Return"
  | "Illusion Veil";

export interface Subclass {
  name: string;
  icon: string;
}

export interface Ability {
  name: string;
  icon: string;
  description: string;
}

export interface Character {
  name: string;
  quality: Quality;
  character_class: CharacterClass;
  factions: [Faction, Faction];
  is_global: boolean;
  subclasses: string[];
  height: number;
  weight: number;
  lore: string;
  abilities: Ability[];
}
