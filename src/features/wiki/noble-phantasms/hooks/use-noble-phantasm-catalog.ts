import { STORAGE_KEY } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import {
  EMPTY_NOBLE_PHANTASM_FILTERS,
  matchesNoblePhantasmFilters,
} from '@/features/wiki/noble-phantasms/utils/filter-noble-phantasms';
import { useFilteredPageData } from '@/hooks';
import { compareQualityThenName } from '@/utils/quality';

export function useNoblePhantasmCatalog(
  noblePhantasms: NoblePhantasm[],
  characterByIdentity: Map<string, Character>,
  characterNames: Map<string, string>
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
    sortFn: (a, b, column, direction) => {
      if (column) {
        let comparison = 0;
        if (column === 'name') comparison = a.name.localeCompare(b.name);
        else if (column === 'character') {
          const aName = characterNames.get(a.character_slug ?? '') ?? '';
          const bName = characterNames.get(b.character_slug ?? '') ?? '';
          if (!aName && bName) return 1;
          if (aName && !bName) return -1;
          comparison = aName.localeCompare(bName);
        } else if (column === 'rarity') {
          comparison = compareQualityThenName(
            a.quality,
            b.quality,
            a.name,
            b.name
          );
        } else if (column === 'effects') {
          comparison = b.effects.length - a.effects.length;
        } else if (column === 'skills') {
          comparison = b.skills.length - a.skills.length;
        }
        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison;
        }
      }

      const characterComparison = (
        characterNames.get(a.character_slug ?? '') ?? ''
      ).localeCompare(characterNames.get(b.character_slug ?? '') ?? '');
      return characterComparison || a.name.localeCompare(b.name);
    },
  });
}
