export interface NoblePhantasmEffect {
  tier?: string | null;
  description: string;
}

export interface NoblePhantasmSkill {
  level: number;
  tier?: string | null;
  description: string;
}

export interface NoblePhantasm {
  slug: string;
  name: string;
  character_slug: string | null;
  effects: NoblePhantasmEffect[];
  skills: NoblePhantasmSkill[];
  last_updated?: number;
}
