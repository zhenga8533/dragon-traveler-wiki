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
}
