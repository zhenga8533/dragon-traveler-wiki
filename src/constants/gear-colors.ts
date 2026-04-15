import type { GearType } from '@/features/wiki/gear/types';

export const GEAR_TYPE_ORDER: GearType[] = [
  'Headgear',
  'Chestplate',
  'Bracers',
  'Boots',
  'Weapon',
  'Accessory',
];

export const GEAR_TYPE_COLOR: Record<GearType, string> = {
  Headgear: 'cyan',
  Chestplate: 'blue',
  Bracers: 'orange',
  Boots: 'lime',
  Weapon: 'red',
  Accessory: 'grape',
};
