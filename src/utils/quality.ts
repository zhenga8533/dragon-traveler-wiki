import { QUALITY_ORDER } from '@/constants/quality';
import type { Quality } from '@/types/quality';

export function isQuality(value: unknown): value is Quality {
  return typeof value === 'string' && QUALITY_ORDER.includes(value as Quality);
}

export function toQuality(value: unknown): Quality | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return isQuality(trimmed) ? trimmed : undefined;
}
