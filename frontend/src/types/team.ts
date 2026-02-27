import type { ContentType } from '../constants/content-types';
import type { FactionName } from './faction';

export interface TeamMemberPosition {
  row: number; // 0 = Front, 1 = Middle, 2 = Back
  col: number; // 0 = Left, 1 = Center, 2 = Right
}

export interface TeamMember {
  character_name: string;
  overdrive_order: number | null;
  note?: string;
  position?: TeamMemberPosition;
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
  content_type: ContentType;
  description: string;
  faction: FactionName;
  members: TeamMember[];
  bench?: string[];
  bench_notes?: Record<string, string>;
  wyrmspells?: TeamWyrmspells;
  last_updated: number;
}
