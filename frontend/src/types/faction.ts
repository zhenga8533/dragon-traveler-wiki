import { FactionName } from "./character";

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
}
