import { applyDir } from '@/hooks/use-sort';
import { compareQuality } from '@/utils/quality';
import { getMaxQuality, type Wyrmspell } from './types';

export const WYRMSPELL_TYPE_FILTER_ORDER = [
  'Breach',
  'Refuge',
  'Wildcry',
  "Dragon's Call",
] as const;

export interface WyrmspellFilters {
  search: string;
  types: string[];
  qualities: string[];
  availability: string[];
}

export const EMPTY_WYRMSPELL_FILTERS: WyrmspellFilters = {
  search: '',
  types: [],
  qualities: [],
  availability: [],
};

export function matchesWyrmspellFilters(
  spell: Wyrmspell,
  filters: WyrmspellFilters
) {
  const query = filters.search.trim().toLocaleLowerCase();
  const maxQuality = getMaxQuality(spell)?.quality;
  return (
    (!query || spell.name.toLocaleLowerCase().includes(query)) &&
    (filters.types.length === 0 || filters.types.includes(spell.type)) &&
    (filters.qualities.length === 0 ||
      Boolean(maxQuality && filters.qualities.includes(maxQuality))) &&
    (filters.availability.length === 0 ||
      filters.availability.includes(spell.exclusive_faction ?? 'universal'))
  );
}

export function compareWyrmspells(
  left: Wyrmspell,
  right: Wyrmspell,
  column: string | null,
  direction: 'asc' | 'desc'
) {
  let comparison = 0;
  if (column === 'name') comparison = left.name.localeCompare(right.name);
  else if (column === 'type') comparison = left.type.localeCompare(right.type);
  else if (column === 'quality') {
    comparison = compareQuality(
      getMaxQuality(left)?.quality,
      getMaxQuality(right)?.quality
    );
  } else if (column === 'faction') {
    const leftFaction = left.exclusive_faction ?? '';
    const rightFaction = right.exclusive_faction ?? '';
    if (!leftFaction && rightFaction) comparison = 1;
    else if (leftFaction && !rightFaction) comparison = -1;
    else comparison = leftFaction.localeCompare(rightFaction);
  }
  if (comparison) return applyDir(comparison, direction);

  return (
    left.type.localeCompare(right.type) ||
    compareQuality(
      getMaxQuality(left)?.quality,
      getMaxQuality(right)?.quality
    ) ||
    left.name.localeCompare(right.name)
  );
}
