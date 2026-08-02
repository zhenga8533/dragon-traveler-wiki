import type { Quality } from '@/types/quality';

export type ResourceCategory =
  | 'Container'
  | 'Currency'
  | 'Gift'
  | 'Item'
  | 'Material'
  | 'Summoning'
  | 'Shard';

export interface Resource {
  slug: string;
  name: string;
  description: string;
  category: ResourceCategory;
  quality: Quality;
  last_updated: number;
}
