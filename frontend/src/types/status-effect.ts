export type StatusEffectType =
  | 'Buff'
  | 'Debuff'
  | 'Special'
  | 'Control'
  | 'Elemental'
  | 'Blessing'
  | 'Exclusive';

export interface StatusEffect {
  name: string;
  type: StatusEffectType;
  effect: string;
  remark: string;
}
