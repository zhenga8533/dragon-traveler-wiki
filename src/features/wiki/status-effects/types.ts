export type StatusEffectType =
  | 'Control (CC)'
  | 'Damage Over Time (DoT)'
  | 'Defense / Immunity'
  | 'Elemental'
  | 'Faction / Unique'
  | 'Form / Aspect'
  | 'Stat Buff'
  | 'Stat Debuff'
  | 'Summon'
  | 'Utility / Special';

export interface StatusEffect {
  name: string;
  alts: string[];
  type: StatusEffectType;
  effect: string;
  remark: string;
  last_updated: number;
  icon?: boolean;
}
