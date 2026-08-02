import { STORAGE_KEY } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import {
  compareNoblePhantasms,
  EMPTY_NOBLE_PHANTASM_FILTERS,
  matchesNoblePhantasmFilters,
} from '@/features/wiki/noble-phantasms/filters';
import { useFilteredPageData } from '@/hooks';

export function useNoblePhantasmCatalog(
  noblePhantasms: NoblePhantasm[],
  characterByIdentity: Map<string, Character>,
  characterNames: Map<string, string>,
) {
  return useFilteredPageData(noblePhantasms, {
    emptyFilters: EMPTY_NOBLE_PHANTASM_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.NOBLE_PHANTASM_FILTERS,
      viewMode: STORAGE_KEY.NOBLE_PHANTASM_VIEW_MODE,
      sort: STORAGE_KEY.NOBLE_PHANTASM_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (item, filters) =>
      matchesNoblePhantasmFilters(item, filters, characterByIdentity),
    sortFn: (left, right, column, direction) =>
      compareNoblePhantasms(left, right, column, direction, characterNames),
  });
}
