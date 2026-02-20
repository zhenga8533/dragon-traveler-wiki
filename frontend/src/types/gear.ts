export type GearType =
  | 'Headgear'
  | 'Chestplate'
  | 'Bracers'
  | 'Boots'
  | 'Weapon'
  | 'Accessory';

export interface GearSetBonus {
  quantity: number;
  description: string;
}

export interface GearSet {
  name: string;
  set_bonus: GearSetBonus;
  last_updated?: number;
}

export interface Gear {
  name: string;
  set: string;
  type: GearType;
  lore: string;
  stats: Record<string, string | number>;
  set_bonus?: GearSetBonus;
  last_updated?: number;
}
