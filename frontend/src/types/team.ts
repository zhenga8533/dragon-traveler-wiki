import type { FactionName } from "./faction";

export interface TeamMember {
  character_name: string;
  overdrive_order: number | null;
}

export interface Team {
  name: string;
  author: string;
  content_type: string;
  description: string;
  faction: FactionName;
  members: TeamMember[];
}
