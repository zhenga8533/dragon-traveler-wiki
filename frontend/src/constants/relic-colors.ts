import type { RelicType } from '@/features/wiki/relics/types';

export const RELIC_TYPE_ORDER: RelicType[] = [
  'Sanctuary Relic',
  'Legendary Ritual Vessel',
  'Fated Relic',
  'Symbol of Theocracy',
];

export const RELIC_TYPE_COLOR: Record<RelicType, string> = {
  'Sanctuary Relic': 'teal',
  'Legendary Ritual Vessel': 'violet',
  'Fated Relic': 'orange',
  'Symbol of Theocracy': 'indigo',
};
