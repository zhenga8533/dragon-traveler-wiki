import type { ContentType } from '../constants/content-types';

export type Tier = string;

export interface TierDefinition {
  name: string;
  note?: string;
}

export interface TierEntry {
  character_name: string;
  tier: Tier;
  note?: string;
}

export interface TierList {
  name: string;
  author: string;
  content_type: ContentType;
  description: string;
  /** Custom tier order and notes. Defaults to S+/S/A/B/C/D if absent. */
  tiers?: TierDefinition[];
  entries: TierEntry[];
  last_updated: number;
}
