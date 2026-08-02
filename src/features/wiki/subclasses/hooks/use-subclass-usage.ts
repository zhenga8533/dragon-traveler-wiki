import { useCallback, useEffect, useState } from 'react';
import { CLASS_ORDER } from '@/constants/class-colors';
import { PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import type { Character, CharacterClass } from '@/features/characters/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import {
  compareEntityUsage,
  DEFAULT_USAGE_QUALITY_FILTER,
  type EntityUsage,
} from '@/features/wiki/usage/entity-usage';
import { useEntityUsage } from '@/features/wiki/usage/use-entity-usage';
import { useFilterPanel } from '@/hooks';
import { readStoredJson, writeStoredJson } from '@/utils';
import { getClassRank } from '@/utils/class-order';

function getSubclassUsageReferences(character: Character): string[] {
  return character.recommended_subclasses ?? [];
}

export function useSubclassUsage(
  subclasses: Subclass[],
  characters: Character[],
) {
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [classes, setClasses] = useState<CharacterClass[]>(() =>
    readStoredJson(
      STORAGE_KEY.SUBCLASS_USAGE_CLASSES,
      [],
      (value): value is CharacterClass[] =>
        Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === 'string' &&
            CLASS_ORDER.includes(item as CharacterClass),
        ),
    ),
  );

  useEffect(() => {
    writeStoredJson(STORAGE_KEY.SUBCLASS_USAGE_CLASSES, classes);
  }, [classes]);

  const searchFn = useCallback(
    (entry: EntityUsage<Subclass, Character>, query: string) =>
      entry.item.name.toLowerCase().includes(query) ||
      entry.item.class.toLowerCase().includes(query),
    [],
  );
  const filterFn = useCallback(
    ({ item }: EntityUsage<Subclass, Character>) =>
      classes.length === 0 || classes.includes(item.class),
    [classes],
  );
  const sortFn = useCallback(
    (
      a: EntityUsage<Subclass, Character>,
      b: EntityUsage<Subclass, Character>,
      column: string | null,
      direction: 'asc' | 'desc',
    ) =>
      compareEntityUsage(
        a,
        b,
        column,
        direction,
        (left, right, customColumn) => {
          if (customColumn === 'class') {
            return (
              getClassRank(left.item.class) - getClassRank(right.item.class) ||
              left.item.name.localeCompare(right.item.name)
            );
          }
          if (customColumn === 'tier') {
            return (
              left.item.tier - right.item.tier ||
              left.item.name.localeCompare(right.item.name)
            );
          }
          return null;
        },
      ),
    [],
  );
  const usage = useEntityUsage({
    items: subclasses,
    characters,
    getCharacterReferences: getSubclassUsageReferences,
    searchFn,
    sortFn,
    filterFn,
    storageKeys: {
      quality: STORAGE_KEY.SUBCLASS_USAGE_QUALITY_FILTER,
      search: STORAGE_KEY.SUBCLASS_USAGE_SEARCH,
      sort: STORAGE_KEY.SUBCLASS_USAGE_SORT,
    },
    pageSize: PAGE_SIZE,
    extraPaginationKey: classes.join(','),
  });

  const filterCount =
    (usage.search ? 1 : 0) +
    (usage.qualityFilter !== DEFAULT_USAGE_QUALITY_FILTER ? 1 : 0) +
    classes.length;
  const { setQualityFilter, setSearch } = usage;
  const resetFilters = useCallback(() => {
    setSearch('');
    setQualityFilter(DEFAULT_USAGE_QUALITY_FILTER);
    setClasses([]);
  }, [setQualityFilter, setSearch]);

  return {
    ...usage,
    classes,
    setClasses,
    filterCount,
    filterOpen,
    toggleFilter,
    resetFilters,
  };
}
