export type Tier = "S+" | "S" | "A" | "B" | "C" | "D";

export interface TierEntry {
  character_name: string;
  tier: Tier;
  note?: string;
}

export interface TierList {
  name: string;
  author: string;
  content_type: string;
  description: string;
  entries: TierEntry[];
}
