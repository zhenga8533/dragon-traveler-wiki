export type StatusEffectType =
  | "Buff"
  | "Debuff"
  | "Special"
  | "Control"
  | "Elemental"
  | "Blessing";

export interface StatusEffect {
  name: string;
  type: StatusEffectType;
  effect: string;
  remark: string;
}
