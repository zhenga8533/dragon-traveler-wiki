export type Quality = "Myth" | "Legend+" | "Legend" | "Epic" | "Elite";

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
  characterClass: CharacterClass;
  factions: [Faction, Faction];
  isGlobal: boolean;
  subclasses: Subclass[];
  portraits: string[];
  illustrations: string[];
  height: string;
  weight: string;
  lore: string;
  abilities: Ability[];
}
