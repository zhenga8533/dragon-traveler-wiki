import type { ResourceCategory } from '@/types/resource';

export const RESOURCE_CATEGORY_ORDER: ResourceCategory[] = [
  'Container',
  'Currency',
  'Gift',
  'Item',
  'Material',
  'Summoning',
  'Shard',
];

export const RESOURCE_CATEGORY_COLOR: Record<ResourceCategory, string> = {
  Container: 'grape',
  Currency: 'yellow',
  Gift: 'pink',
  Item: 'teal',
  Material: 'orange',
  Summoning: 'violet',
  Shard: 'cyan',
};
