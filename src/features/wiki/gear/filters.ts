import { GEAR_TYPE_ORDER } from '@/constants/gear-colors';
import { applyDir } from '@/hooks/use-sort';
import type { Quality } from '@/types/quality';
import { compareQuality } from '@/utils/quality';
import type { Gear, GearSet, GearType } from './types';

export interface GearFilters {
  search: string;
  types: GearType[];
  qualities: Quality[];
}

export const EMPTY_GEAR_FILTERS: GearFilters = {
  search: '',
  types: [],
  qualities: [],
};

type GearSetLookup = ReadonlyMap<string, Pick<GearSet, 'name'>>;

function getGearSetName(item: Gear, gearSetBySlug: GearSetLookup): string {
  return gearSetBySlug.get(item.set)?.name ?? item.set;
}

export function matchesGearFilters(
  item: Gear,
  filters: GearFilters,
  gearSetBySlug: GearSetLookup,
): boolean {
  const query = filters.search.trim().toLocaleLowerCase();
  return (
    (!query ||
      item.name.toLocaleLowerCase().includes(query) ||
      item.set.toLocaleLowerCase().includes(query) ||
      getGearSetName(item, gearSetBySlug)
        .toLocaleLowerCase()
        .includes(query)) &&
    (filters.types.length === 0 || filters.types.includes(item.type)) &&
    (filters.qualities.length === 0 || filters.qualities.includes(item.quality))
  );
}

export function compareGear(
  left: Gear,
  right: Gear,
  column: string | null,
  direction: 'asc' | 'desc',
  gearSetBySlug: GearSetLookup,
): number {
  const typeComparison =
    GEAR_TYPE_ORDER.indexOf(left.type) - GEAR_TYPE_ORDER.indexOf(right.type);
  const qualityComparison = compareQuality(left.quality, right.quality);
  const nameComparison = left.name.localeCompare(right.name);

  let comparison = 0;
  if (column === 'name') comparison = nameComparison;
  else if (column === 'set') {
    comparison = getGearSetName(left, gearSetBySlug).localeCompare(
      getGearSetName(right, gearSetBySlug),
    );
  } else if (column === 'type') {
    comparison = typeComparison || qualityComparison || nameComparison;
  } else if (column === 'rarity') {
    comparison = qualityComparison || typeComparison || nameComparison;
  }

  if (comparison) return applyDir(comparison, direction);
  return typeComparison || qualityComparison || nameComparison;
}
