import type { CharacterClass } from '../types/character';
import type { FactionName } from '../types/faction';
import type { ResourceCategory } from '../types/resource';
import type { StatusEffectType } from '../types/status-effect';
import type { TierDefinition } from '../types/tier-list';
import { QUALITY_COLOR, QUALITY_ORDER } from './quality';

export const CLASS_ORDER: CharacterClass[] = [
  'Guardian',
  'Priest',
  'Assassin',
  'Warrior',
  'Archer',
  'Mage',
];

export { QUALITY_COLOR, QUALITY_ORDER };

export const STATE_COLOR: Record<StatusEffectType, string> = {
  Buff: 'green',
  Debuff: 'red',
  Special: 'blue',
  Control: 'violet',
  Elemental: 'cyan',
  Blessing: 'yellow',
  Exclusive: 'orange',
};

export const STATE_ORDER: StatusEffectType[] = [
  'Buff',
  'Debuff',
  'Special',
  'Control',
  'Elemental',
  'Blessing',
  'Exclusive',
];

export const FACTION_COLOR: Record<FactionName, string> = {
  'Elemental Echo': 'red',
  'Wild Spirit': 'green',
  'Arcane Wisdom': 'blue',
  'Sanctum Glory': 'yellow',
  'Otherworld Return': 'purple',
  'Illusion Veil': 'black',
};

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

export const TIER_ORDER: string[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

export const TIER_COLOR: Record<string, string> = {
  'S+': 'pink',
  S: 'red',
  A: 'orange',
  B: 'yellow',
  C: 'green',
  D: 'gray',
};

const CUSTOM_TIER_COLOR_CYCLE = [
  'blue',
  'teal',
  'violet',
  'grape',
  'indigo',
  'cyan',
  'lime',
  'orange',
  'pink',
];

/** Returns a Mantine color for a tier, cycling through a palette for custom tiers. */
export function getTierColor(tier: string, index = 0): string {
  return (
    TIER_COLOR[tier] ??
    CUSTOM_TIER_COLOR_CYCLE[index % CUSTOM_TIER_COLOR_CYCLE.length]
  );
}

/** Default tier definitions used when a tier list has no custom tiers. */
export const DEFAULT_TIER_DEFINITIONS: TierDefinition[] = [
  { name: 'S+' },
  { name: 'S' },
  { name: 'A' },
  { name: 'B' },
  { name: 'C' },
  { name: 'D' },
];
