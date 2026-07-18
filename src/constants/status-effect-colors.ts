import type { StatusEffectType } from '@/features/wiki/status-effects/types';

export const STATE_COLOR: Record<StatusEffectType, string> = {
  Control: 'violet',
  'Stat Buff': 'green',
  'Stat Debuff': 'red',
  Defense: 'teal',
  Healing: 'lime',
  Elemental: 'cyan',
  Summon: 'indigo',
  Form: 'grape',
  Damage: 'orange',
  Unique: 'yellow',
  Utility: 'blue',
};

export const STATE_ORDER: StatusEffectType[] = [
  'Control',
  'Stat Buff',
  'Stat Debuff',
  'Defense',
  'Healing',
  'Elemental',
  'Summon',
  'Form',
  'Damage',
  'Unique',
  'Utility',
];
