import type { CharacterClass } from './character';
import type { Quality } from './quality';

export interface ArtifactEffect {
  level: number;
  description: string;
}

export interface ArtifactTreasure {
  name: string;
  lore: string;
  character_class: CharacterClass;
  effect: ArtifactEffect[];
}

export interface Artifact {
  name: string;
  is_global: boolean;
  lore: string;
  quality: Quality;
  effect: ArtifactEffect[];
  columns: number;
  rows: number;
  treasures: ArtifactTreasure[];
  last_updated: number;
}
