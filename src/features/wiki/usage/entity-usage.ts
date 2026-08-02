import type { Quality } from '@/types/quality';
import {
  compareQualityThenName,
  getQualityRank,
  UNKNOWN_QUALITY_RANK,
} from '../../../utils/quality.ts';

export type UsageQualityFilter = 'ssr-plus' | 'ssr' | 'all';

export const USAGE_QUALITY_OPTIONS: {
  value: UsageQualityFilter;
  label: string;
}[] = [
  { value: 'ssr-plus', label: 'SSR+ and above' },
  { value: 'ssr', label: 'SSR and above' },
  { value: 'all', label: 'All characters' },
];

export const DEFAULT_USAGE_QUALITY_FILTER: UsageQualityFilter = 'ssr-plus';

const USAGE_QUALITY_THRESHOLD: Record<UsageQualityFilter, number> = {
  'ssr-plus': getQualityRank('SSR+'),
  ssr: getQualityRank('SSR'),
  all: UNKNOWN_QUALITY_RANK,
};

interface UsageItem {
  slug: string;
  name: string;
}

interface UsageCharacter {
  name: string;
  quality: Quality;
}

export interface EntityUsage<
  TItem extends UsageItem,
  TCharacter extends UsageCharacter,
> {
  item: TItem;
  characters: TCharacter[];
  count: number;
  percentage: number;
}

export function filterUsageCharacters<TCharacter extends UsageCharacter>(
  characters: readonly TCharacter[],
  qualityFilter: UsageQualityFilter
): TCharacter[] {
  const threshold = USAGE_QUALITY_THRESHOLD[qualityFilter];
  return characters.filter(
    (character) => getQualityRank(character.quality) <= threshold
  );
}

export function buildEntityUsage<
  TItem extends UsageItem,
  TCharacter extends UsageCharacter,
>(options: {
  items: readonly TItem[];
  characters: readonly TCharacter[];
  getCharacterReferences: (character: TCharacter) => Iterable<string>;
  getItemReferences?: (item: TItem) => Iterable<string>;
  getCharacterGroupKey?: (character: TCharacter) => string;
}): EntityUsage<TItem, TCharacter>[] {
  const {
    items,
    characters,
    getCharacterReferences,
    getItemReferences = (item) => [item.slug],
    getCharacterGroupKey,
  } = options;
  const itemByReference = new Map<string, TItem>();
  for (const item of items) {
    for (const reference of getItemReferences(item)) {
      if (reference) itemByReference.set(reference, item);
    }
  }

  const charactersByItem = new Map<string, TCharacter[]>();
  const characterGroupsByItem = new Map<string, Set<string>>();
  for (const character of characters) {
    for (const reference of new Set(getCharacterReferences(character))) {
      const item = itemByReference.get(reference.trim());
      if (!item) continue;
      if (getCharacterGroupKey) {
        const groups = characterGroupsByItem.get(item.slug) ?? new Set<string>();
        groups.add(getCharacterGroupKey(character));
        characterGroupsByItem.set(item.slug, groups);
        continue;
      }
      const usingCharacters = charactersByItem.get(item.slug) ?? [];
      usingCharacters.push(character);
      charactersByItem.set(item.slug, usingCharacters);
    }
  }

  return items
    .map((item) => {
      const groups = characterGroupsByItem.get(item.slug);
      const matchedCharacters = groups
        ? characters.filter((character) =>
            groups.has(getCharacterGroupKey!(character))
          )
        : charactersByItem.get(item.slug) ?? [];
      const usingCharacters = [...matchedCharacters].sort((a, b) =>
        compareQualityThenName(a.quality, b.quality, a.name, b.name)
      );
      const count = usingCharacters.length;
      return {
        item,
        characters: usingCharacters,
        count,
        percentage: characters.length
          ? Math.round((count / characters.length) * 100)
          : 0,
      };
    })
    .sort(
      (a, b) => b.count - a.count || a.item.name.localeCompare(b.item.name)
    );
}

export function compareEntityUsage<
  TItem extends UsageItem,
  TCharacter extends UsageCharacter,
>(
  a: EntityUsage<TItem, TCharacter>,
  b: EntityUsage<TItem, TCharacter>,
  column: string | null,
  direction: 'asc' | 'desc',
  compareCustomColumn: (
    a: EntityUsage<TItem, TCharacter>,
    b: EntityUsage<TItem, TCharacter>,
    column: string
  ) => number | null
): number {
  let comparison: number | null;
  if (column === 'name') {
    comparison = a.item.name.localeCompare(b.item.name);
  } else if (column === 'count') {
    comparison = a.count - b.count;
  } else if (column) {
    comparison = compareCustomColumn(a, b, column);
  } else {
    comparison = null;
  }

  if (comparison === null) return 0;
  return direction === 'asc' ? comparison : -comparison;
}
