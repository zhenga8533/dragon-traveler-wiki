import type { Quality } from '../types/character';
import type { FactionName } from '../types/faction';
import type { ResourceCategory } from '../types/resource';
import type { StatusEffectType } from '../types/status-effect';
import type { Tier } from '../types/tier-list';

export const QUALITY_ORDER: Quality[] = [
  'SSR EX',
  'SSR+',
  'SSR',
  'SR+',
  'R',
  'N',
];

export const QUALITY_COLOR: Record<Quality, string> = {
  'SSR EX': 'red',
  'SSR+': 'orange',
  SSR: 'yellow',
  'SR+': 'violet',
  R: 'blue',
  N: 'gray',
};

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

export const TIER_ORDER: Tier[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

export const TIER_COLOR: Record<Tier, string> = {
  'S+': 'pink',
  S: 'red',
  A: 'orange',
  B: 'yellow',
  C: 'green',
  D: 'gray',
};
