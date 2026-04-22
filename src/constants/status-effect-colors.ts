import type { StatusEffectType } from '@/features/wiki/status-effects/types';

export const STATE_COLOR: Record<StatusEffectType, string> = {
  'Stat Buff': 'green',
  'Stat Debuff': 'red',
  'Control (CC)': 'violet',
  'Damage Over Time (DoT)': 'orange',
  'Defense / Immunity': 'teal',
  Elemental: 'cyan',
  'Form / Aspect': 'grape',
  'Faction / Unique': 'yellow',
  Summon: 'indigo',
  'Utility / Special': 'blue',
};

export const STATE_ORDER: StatusEffectType[] = [
  'Stat Buff',
  'Stat Debuff',
  'Control (CC)',
  'Damage Over Time (DoT)',
  'Defense / Immunity',
  'Elemental',
  'Form / Aspect',
  'Faction / Unique',
  'Summon',
  'Utility / Special',
];
