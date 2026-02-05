import type { FactionName } from "./character";

export interface Team {
  name: string;
  author: string;
  content_type: string;
  description: string;
  faction: FactionName;
  characters: string[];
}
