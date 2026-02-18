import type { Quality } from './character';

export type ResourceCategory =
  | 'Currency'
  | 'Gift'
  | 'Item'
  | 'Material'
  | 'Summoning'
  | 'Shard';

export interface Resource {
  id?: number;
  name: string;
  description: string;
  category: ResourceCategory;
  quality: Quality;
  last_updated: number;
}
