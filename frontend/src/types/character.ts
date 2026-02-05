import type { FactionName } from "./faction";

export type Quality = "SSR EX" | "SSR+" | "SSR" | "SR+" | "R" | "N";

export type CharacterClass =
  | "Guardian"
  | "Priest"
  | "Assassin"
  | "Warrior"
  | "Archer"
  | "Mage";

export interface Skill {
  name: string;
  description: string;
}

export interface Character {
  name: string;
  quality: Quality;
  character_class: CharacterClass;
  factions: FactionName[];
  is_global: boolean;
  subclasses: string[];
  height: string;
  weight: string;
  lore: string;
  quote: string;
  origin: string;
  skills: Skill[];
  noble_phantasm: string;
}
