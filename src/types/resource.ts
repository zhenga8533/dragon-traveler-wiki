import type { Quality } from './quality';

export type ResourceCategory =
  | 'Container'
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
