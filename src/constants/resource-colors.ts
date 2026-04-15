import type { ResourceCategory } from '@/types/resource';

export const RESOURCE_CATEGORY_ORDER: ResourceCategory[] = [
  'Currency',
  'Gift',
  'Item',
  'Material',
  'Summoning',
  'Shard',
];

export const RESOURCE_CATEGORY_COLOR: Record<ResourceCategory, string> = {
  Currency: 'yellow',
  Gift: 'pink',
  Item: 'teal',
  Material: 'orange',
  Summoning: 'violet',
  Shard: 'cyan',
};
