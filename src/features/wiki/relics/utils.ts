import type { Relic, RelicType } from './types';

export function getRelicOracleScroll(relic: Relic): string | null {
  return relic.oracle_scroll ?? null;
}

export function getRelicTypeOrder(
  type: RelicType,
  orderedTypes: readonly RelicType[]
): number {
  const index = orderedTypes.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
