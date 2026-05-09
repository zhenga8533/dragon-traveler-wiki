export const NOBLE_PHANTASM_TIER_DETAILS: Record<
  string,
  { label: string; color: string; order: number }
> = {
  Excellence: { label: 'Purple 6', color: 'violet', order: 1 },
  Ultimate: { label: 'Red 6', color: 'red', order: 2 },
  Peerless: { label: 'Divinity 3', color: 'yellow', order: 3 },
};

export function getNoblePhantasmTierDetail(tier: string | null | undefined) {
  if (!tier) return null;
  return NOBLE_PHANTASM_TIER_DETAILS[tier] ?? null;
}

export function getNoblePhantasmTierOrder(tier: string | null | undefined) {
  return getNoblePhantasmTierDetail(tier)?.order ?? Number.MAX_SAFE_INTEGER;
}
