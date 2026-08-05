import { RELIC_TYPE_ORDER } from '@/constants/relic-colors';
import { applyDir } from '@/hooks/use-sort';
import type { Quality } from '@/types/quality';
import { compareQuality } from '@/utils/quality';
import type { Relic, RelicType } from './types';
import { getRelicTypeOrder } from './utils';

export type OracleScrollMembership = 'member' | 'none';

export interface RelicFilters {
  search: string;
  types: RelicType[];
  qualities: Quality[];
  oracleScrollMembership: OracleScrollMembership[];
}

export const EMPTY_RELIC_FILTERS: RelicFilters = {
  search: '',
  types: [],
  qualities: [],
  oracleScrollMembership: [],
};

export function matchesRelicFilters(
  item: Relic,
  filters: RelicFilters,
): boolean {
  const query = filters.search.trim().toLocaleLowerCase();
  return (
    (!query ||
      item.name.toLocaleLowerCase().includes(query) ||
      item.oracle_scroll?.name.toLocaleLowerCase().includes(query) ||
      item.lore.toLocaleLowerCase().includes(query)) &&
    (filters.types.length === 0 || filters.types.includes(item.type)) &&
    (filters.qualities.length === 0 ||
      filters.qualities.includes(item.quality)) &&
    (filters.oracleScrollMembership.length === 0 ||
      filters.oracleScrollMembership.includes(
        item.oracle_scroll ? 'member' : 'none',
      ))
  );
}

export function compareRelics(
  left: Relic,
  right: Relic,
  column: string | null,
  direction: 'asc' | 'desc',
): number {
  const typeComparison =
    getRelicTypeOrder(left.type, RELIC_TYPE_ORDER) -
    getRelicTypeOrder(right.type, RELIC_TYPE_ORDER);
  const qualityComparison = compareQuality(left.quality, right.quality);
  const oracleComparison = (left.oracle_scroll?.name ?? '').localeCompare(
    right.oracle_scroll?.name ?? '',
  );
  const nameComparison = left.name.localeCompare(right.name);

  let comparison = 0;
  if (column === 'name') comparison = nameComparison;
  else if (column === 'type') {
    comparison =
      typeComparison || qualityComparison || oracleComparison || nameComparison;
  } else if (column === 'rarity') {
    comparison =
      qualityComparison || oracleComparison || typeComparison || nameComparison;
  } else if (column === 'oracle') {
    comparison = oracleComparison || typeComparison || nameComparison;
  }

  if (comparison) return applyDir(comparison, direction);
  return (
    qualityComparison || oracleComparison || typeComparison || nameComparison
  );
}
