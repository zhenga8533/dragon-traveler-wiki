import { STORAGE_KEY } from '@/constants/ui';
import type { Subclass } from '@/features/wiki/subclasses/types';
import { useFilteredPageData, useSearchParamFilter } from '@/hooks';
import {
  compareSubclasses,
  EMPTY_SUBCLASS_FILTERS,
  matchesSubclassFilters,
} from '../filters';

export function useSubclassCatalog(subclasses: Subclass[]) {
  const catalog = useFilteredPageData(subclasses, {
    emptyFilters: EMPTY_SUBCLASS_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.SUBCLASS_FILTERS,
      viewMode: STORAGE_KEY.SUBCLASS_VIEW_MODE,
      sort: STORAGE_KEY.SUBCLASS_SORT,
    },
    defaultViewMode: 'list',
    filterFn: matchesSubclassFilters,
    sortFn: compareSubclasses,
  });
  useSearchParamFilter(catalog.setFilters);
  return catalog;
}
