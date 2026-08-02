import { matchesContentTypeFilters } from '@/constants/content-types';
import { getTierListEntityType, type TierList } from './types';

export interface TierListViewFilters {
  [key: string]: string[];
  contentTypes: string[];
  entityTypes: string[];
  factions: string[];
  classes: string[];
  qualities: string[];
}

export const EMPTY_TIER_LIST_VIEW_FILTERS: TierListViewFilters = {
  contentTypes: [],
  entityTypes: [],
  factions: [],
  classes: [],
  qualities: [],
};

export function matchesTierListFilters(
  tierList: TierList,
  search: string,
  filters: TierListViewFilters
): boolean {
  const query = search.trim().toLocaleLowerCase();
  if (
    query &&
    ![tierList.name, tierList.author, tierList.description ?? '']
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  ) {
    return false;
  }
  return (
    (filters.entityTypes.length === 0 ||
      filters.entityTypes.includes(getTierListEntityType(tierList))) &&
    matchesContentTypeFilters(tierList.content_type, filters.contentTypes)
  );
}
