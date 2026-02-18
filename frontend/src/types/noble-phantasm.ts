export interface NoblePhantasmEffect {
  tier: string | null;
  tier_level: number | null;
  description: string;
}

export interface NoblePhantasmSkill {
  level: number;
  tier: string | null;
  tier_level: number | null;
  description: string;
}

export interface NoblePhantasm {
  name: string;
  character: string | null;
  is_global: boolean;
  lore: string;
  effects: NoblePhantasmEffect[];
  skills: NoblePhantasmSkill[];
  last_updated?: number;
}
