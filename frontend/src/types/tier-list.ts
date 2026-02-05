export type Tier = "S+" | "S" | "A" | "B" | "C" | "D";

export interface TierEntry {
  characterName: string;
  tier: Tier;
}

export interface TierListCategory {
  name: string;
  description?: string;
  entries: TierEntry[];
}
