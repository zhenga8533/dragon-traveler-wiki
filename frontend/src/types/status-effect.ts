export type StatusEffectType =
  | "Buff"
  | "Debuff"
  | "Special"
  | "Control"
  | "Elemental"
  | "Blessing";

export interface StatusEffect {
  icon: string;
  name: string;
  type: StatusEffectType;
  effect: string;
  remark: string;
}
