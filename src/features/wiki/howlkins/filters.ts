import { applyDir } from '@/hooks/use-sort';
import type { Quality } from '@/types/quality';
import { compareQuality, compareQualityThenName } from '@/utils/quality';
import type { Howlkin } from './types';

export type AllianceMembership = 'member' | 'none';

export interface HowlkinFilters {
  search: string;
  qualities: Quality[];
  allianceMembership: AllianceMembership[];
}

export const EMPTY_HOWLKIN_FILTERS: HowlkinFilters = {
  search: '',
  qualities: [],
  allianceMembership: [],
};

export function matchesHowlkinFilters(
  howlkin: Howlkin,
  filters: HowlkinFilters,
  howlkinToAlliance: ReadonlyMap<string, string>
): boolean {
  const query = filters.search.trim().toLocaleLowerCase();
  if (query && !howlkin.name.toLocaleLowerCase().includes(query)) return false;
  if (
    filters.qualities.length > 0 &&
    !filters.qualities.includes(howlkin.quality)
  ) {
    return false;
  }
  if (filters.allianceMembership.length === 0) return true;

  const membership: AllianceMembership = howlkinToAlliance.has(howlkin.slug)
    ? 'member'
    : 'none';
  return filters.allianceMembership.includes(membership);
}

export function compareHowlkins(
  left: Howlkin,
  right: Howlkin,
  column: string | null,
  direction: 'asc' | 'desc'
): number {
  let comparison = 0;
  if (column === 'name') comparison = left.name.localeCompare(right.name);
  else if (column === 'quality') {
    comparison = compareQuality(left.quality, right.quality);
  }

  return comparison
    ? applyDir(comparison, direction)
    : compareQualityThenName(
        left.quality,
        right.quality,
        left.name,
        right.name
      );
}
