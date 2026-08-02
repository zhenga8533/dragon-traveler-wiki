import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Character } from '@/features/characters/types';
import { useSecondaryTabList } from '@/hooks/use-secondary-tab-list';
import {
  buildEntityUsage,
  DEFAULT_USAGE_QUALITY_FILTER,
  filterUsageCharacters,
  type EntityUsage,
  type UsageQualityFilter,
} from './entity-usage';

interface UsageItem {
  slug: string;
  name: string;
}

interface EntityUsageStorageKeys {
  quality: string;
  search: string;
  sort: string;
}

export function useEntityUsage<TItem extends UsageItem>(options: {
  items: readonly TItem[];
  characters: readonly Character[];
  getCharacterReferences: (character: Character) => Iterable<string>;
  getItemReferences?: (item: TItem) => Iterable<string>;
  getCharacterGroupKey?: (character: Character) => string;
  searchFn: (entry: EntityUsage<TItem, Character>, query: string) => boolean;
  sortFn: (
    a: EntityUsage<TItem, Character>,
    b: EntityUsage<TItem, Character>,
    column: string | null,
    direction: 'asc' | 'desc',
  ) => number;
  filterFn?: (entry: EntityUsage<TItem, Character>) => boolean;
  storageKeys: EntityUsageStorageKeys;
  pageSize: number;
  extraPaginationKey?: unknown;
}) {
  const {
    items,
    characters,
    getCharacterReferences,
    getItemReferences,
    getCharacterGroupKey,
    searchFn,
    sortFn,
    filterFn,
    storageKeys,
    pageSize,
    extraPaginationKey,
  } = options;
  const [qualityFilter, setQualityFilter] = useState<UsageQualityFilter>(() => {
    if (typeof window === 'undefined') return DEFAULT_USAGE_QUALITY_FILTER;
    const stored = window.localStorage.getItem(storageKeys.quality);
    return stored === 'ssr-plus' || stored === 'ssr' || stored === 'all'
      ? stored
      : DEFAULT_USAGE_QUALITY_FILTER;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKeys.quality, qualityFilter);
  }, [qualityFilter, storageKeys.quality]);

  const eligibleCharacters = useMemo(
    () => filterUsageCharacters(characters, qualityFilter),
    [characters, qualityFilter],
  );
  const usage = useMemo(
    () =>
      buildEntityUsage({
        items,
        characters: eligibleCharacters,
        getCharacterReferences,
        getItemReferences,
        getCharacterGroupKey,
      }),
    [
      eligibleCharacters,
      getCharacterReferences,
      getCharacterGroupKey,
      getItemReferences,
      items,
    ],
  );
  const filteredByEntity = useMemo(
    () => (filterFn ? usage.filter(filterFn) : usage),
    [filterFn, usage],
  );
  const list = useSecondaryTabList(filteredByEntity, {
    searchFn,
    sortFn,
    storageKeys: {
      search: storageKeys.search,
      sort: storageKeys.sort,
    },
    pageSize,
    extraPaginationKey: `${qualityFilter}|${String(extraPaginationKey ?? '')}`,
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    () => new Set(),
  );
  const toggleExpandedItem = useCallback((slug: string) => {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  return {
    ...list,
    usage,
    eligibleCharacters,
    qualityFilter,
    setQualityFilter,
    expandedItems,
    toggleExpandedItem,
  };
}
