export type StatusEffectState = "Buff" | "Debuff" | "Special";

export interface StatusEffect {
  icon: string;
  name: string;
  state: StatusEffectState;
  effect: string;
  remark: string;
}
