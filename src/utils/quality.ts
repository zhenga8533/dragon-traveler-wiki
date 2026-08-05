import { QUALITY_ORDER, type Quality } from '../constants/quality.ts';

export const UNKNOWN_QUALITY_RANK = QUALITY_ORDER.length;

export function isQuality(value: unknown): value is Quality {
  return typeof value === 'string' && QUALITY_ORDER.includes(value as Quality);
}

export function toQuality(value: unknown): Quality | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return isQuality(trimmed) ? trimmed : undefined;
}

/** Returns a rarest-first rank, with unknown values after every known tier. */
export function getQualityRank(value: unknown): number {
  const quality = toQuality(value);
  return quality === undefined
    ? UNKNOWN_QUALITY_RANK
    : QUALITY_ORDER.indexOf(quality);
}

/** Rarest-first comparator. Unknown values sort after every known tier. */
export function compareQuality(left: unknown, right: unknown): number {
  return getQualityRank(left) - getQualityRank(right);
}

export function compareQualityThenName(
  leftQuality: unknown,
  rightQuality: unknown,
  leftName: string,
  rightName: string,
): number {
  return (
    compareQuality(leftQuality, rightQuality) ||
    leftName.localeCompare(rightName)
  );
}
