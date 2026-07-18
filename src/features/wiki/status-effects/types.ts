export type StatusEffectType =
  | 'Control'
  | 'Stat Buff'
  | 'Stat Debuff'
  | 'Defense'
  | 'Healing'
  | 'Elemental'
  | 'Summon'
  | 'Form'
  | 'Damage'
  | 'Unique'
  | 'Utility';

export interface StatusEffect {
  slug: string;
  name: string;
  type: StatusEffectType;
  effect: string;
  remark: string;
  last_updated: number;
  icon?: boolean;
}
