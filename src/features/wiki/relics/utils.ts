import type { RelicType } from './types';

export function getRelicTypeOrder(
  type: RelicType,
  orderedTypes: readonly RelicType[],
): number {
  const index = orderedTypes.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
