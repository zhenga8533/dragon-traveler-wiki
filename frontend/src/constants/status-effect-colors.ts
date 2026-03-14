import type { StatusEffectType } from '@/features/wiki/status-effects/types';

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
