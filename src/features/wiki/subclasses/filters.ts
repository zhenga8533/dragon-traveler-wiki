import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import { createClassFilterGroup } from '@/components/common/EntityFilterGroups';
import type { CharacterClass } from '@/features/characters/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import { getClassRank } from '@/utils/class-order';

export interface SubclassFilters {
  search: string;
  classes: CharacterClass[];
  tiers: string[];
}

export const EMPTY_SUBCLASS_FILTERS: SubclassFilters = {
  search: '',
  classes: [],
  tiers: [],
};

export const SUBCLASS_FILTER_GROUPS: ChipFilterGroup[] = [
  createClassFilterGroup(),
  {
    key: 'tiers',
    label: 'Tier',
    options: ['1', '2', '3'],
  },
];

export function matchesSubclassFilters(
  item: Subclass,
  filters: SubclassFilters
): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search && !item.name.toLowerCase().includes(search)) return false;
  if (filters.classes.length > 0 && !filters.classes.includes(item.class)) {
    return false;
  }
  return filters.tiers.length === 0 || filters.tiers.includes(String(item.tier));
}

export function compareSubclasses(
  a: Subclass,
  b: Subclass,
  column: string | null,
  direction: 'asc' | 'desc'
): number {
  if (column) {
    let comparison = 0;
    if (column === 'name') comparison = a.name.localeCompare(b.name);
    else if (column === 'class') {
      comparison = getClassRank(a.class) - getClassRank(b.class);
    } else if (column === 'tier') comparison = a.tier - b.tier;
    if (comparison !== 0) {
      return direction === 'asc' ? comparison : -comparison;
    }
  }

  return (
    getClassRank(a.class) - getClassRank(b.class) ||
    a.tier - b.tier ||
    a.name.localeCompare(b.name)
  );
}
