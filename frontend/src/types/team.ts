import type { FactionName } from './faction';

export interface TeamMember {
  character_name: string;
  overdrive_order: number | null;
  substitutes?: string[];
  note?: string;
}

export interface TeamWyrmspells {
  breach?: string;
  refuge?: string;
  wildcry?: string;
  dragons_call?: string;
}

export interface Team {
  name: string;
  author: string;
  content_type: string;
  description: string;
  faction: FactionName;
  members: TeamMember[];
  wyrmspells?: TeamWyrmspells;
  last_updated: number;
}
