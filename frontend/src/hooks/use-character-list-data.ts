import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useContext, useMemo } from 'react';
import { BREAKPOINTS, STORAGE_KEY } from '../constants/ui';
import { TierListReferenceContext } from '../contexts';
import type { Character } from '../types/character';
import {
  buildCharacterByIdentityMap,
  buildCharacterNameCounts,
  buildPreferredCharacterByNameMap,
  getCharacterIdentityKey,
  resolveCharacterByNameAndQuality,
} from '../utils/character-route';
import type { CharacterFilters } from '../utils/filter-characters';
import {
  compareCharactersByQualityThenName,
  EMPTY_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
} from '../utils/filter-characters';
import type { ViewMode } from './use-filters';
import { useFilterPanel, useFilters, useViewMode } from './use-filters';
import { usePagination } from './use-pagination';
import { applyDir, useSortState } from './use-sort';

export interface CharacterListData {
  filters: CharacterFilters;
  setFilters: (filters: CharacterFilters) => void;
  filterOpen: boolean;
  toggleFilter: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortCol: string | null;
  sortDir: 'asc' | 'desc';
  handleSort: (key: string) => void;
  characterNameCounts: Map<string, number>;
  effectOptions: string[];
  tierOptions: string[];
  selectedTierListName: string | null;
  getTierLabel: (char: Character) => string | undefined;
  filteredAndSorted: Character[];
  pageItems: Character[];
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  activeFilterCount: number;
}

export function useCharacterListData(
  characters: Character[]
): CharacterListData {
  const { tierLists, selectedTierListName } = useContext(
    TierListReferenceContext
  );

  const { filters, setFilters } = useFilters<CharacterFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.CHARACTER_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.CHARACTER_VIEW_MODE,
    defaultMode: 'grid',
  });
  const { sortState, handleSort } = useSortState(STORAGE_KEY.CHARACTER_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

  // Mirror CHARACTER_GRID_COLS breakpoints to keep page size = whole rows
  const isMd = useMediaQuery(BREAKPOINTS.MD);
  const isSm = useMediaQuery(BREAKPOINTS.DESKTOP);
  const isXs = useMediaQuery(BREAKPOINTS.XS);
  const activeCols = isMd ? 6 : isSm ? 4 : isXs ? 3 : 2;
  const pageSize = activeCols * 10;

  const effectOptions = useMemo(
    () => extractAllEffectRefs(characters),
    [characters]
  );

  const characterNameCounts = useMemo(
    () => buildCharacterNameCounts(characters),
    [characters]
  );

  const preferredCharacterByName = useMemo(
    () => buildPreferredCharacterByNameMap(characters),
    [characters]
  );

  const characterByIdentity = useMemo(
    () => buildCharacterByIdentityMap(characters),
    [characters]
  );

  const tierOptions = useMemo(() => {
    if (!selectedTierListName) return [];
    const list = tierLists.find((l) => l.name === selectedTierListName);
    if (!list) return [];
    const seen = new Set<string>();
    const tiers: string[] = [];
    for (const t of list.tiers ?? []) {
      if (!seen.has(t.name)) {
        seen.add(t.name);
        tiers.push(t.name);
      }
    }
    for (const e of list.entries) {
      if (!seen.has(e.tier)) {
        seen.add(e.tier);
        tiers.push(e.tier);
      }
    }
    tiers.push('Unranked');
    return tiers;
  }, [tierLists, selectedTierListName]);

  const tierRank = useMemo(() => {
    const rank = new Map<string, number>();
    tierOptions.forEach((tier, index) => rank.set(tier, index));
    return rank;
  }, [tierOptions]);

  const tierLookup = useMemo(() => {
    const map = new Map<string, string>();
    if (!selectedTierListName) return map;
    const list = tierLists.find((l) => l.name === selectedTierListName);
    if (!list) return map;
    for (const entry of list.entries) {
      const resolved = resolveCharacterByNameAndQuality(
        entry.character_name,
        entry.character_quality,
        preferredCharacterByName,
        characterByIdentity
      );
      if (resolved) {
        map.set(getCharacterIdentityKey(resolved), entry.tier);
      }
    }
    return map;
  }, [
    tierLists,
    selectedTierListName,
    preferredCharacterByName,
    characterByIdentity,
  ]);

  const getTierLabel = useCallback(
    (character: Character) => {
      if (!selectedTierListName) return undefined;
      return (
        tierLookup.get(getCharacterIdentityKey(character)) ??
        tierLookup.get(character.name) ??
        'Unranked'
      );
    },
    [selectedTierListName, tierLookup]
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = filterCharacters(
      characters,
      filters,
      selectedTierListName ? tierLookup : undefined
    );
    return [...filtered].sort((a, b) => {
      if (sortCol) {
        let cmp = 0;
        if (sortCol === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortCol === 'quality') {
          cmp = compareCharactersByQualityThenName(a, b);
        } else if (sortCol === 'factions') {
          cmp = (a.factions[0] ?? '').localeCompare(b.factions[0] ?? '');
        } else if (sortCol === 'global') {
          cmp = (b.is_global ? 1 : 0) - (a.is_global ? 1 : 0);
        } else if (sortCol === 'tier') {
          const tA = getTierLabel(a) ?? 'Unranked';
          const tB = getTierLabel(b) ?? 'Unranked';
          const iA = tierRank.get(tA) ?? Number.MAX_SAFE_INTEGER;
          const iB = tierRank.get(tB) ?? Number.MAX_SAFE_INTEGER;
          cmp = iA - iB;
        }
        if (cmp !== 0) return applyDir(cmp, sortDir);
      }
      return compareCharactersByQualityThenName(a, b);
    });
  }, [
    characters,
    filters,
    sortCol,
    sortDir,
    tierLookup,
    tierRank,
    selectedTierListName,
    getTierLabel,
  ]);

  const { page, setPage, totalPages, offset } = usePagination(
    filteredAndSorted.length,
    pageSize,
    JSON.stringify(filters)
  );
  const pageItems = filteredAndSorted.slice(offset, offset + pageSize);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.qualities.length +
    filters.classes.length +
    filters.factions.length +
    (selectedTierListName ? filters.tiers.length : 0) +
    filters.statusEffects.length +
    (filters.globalOnly !== null ? 1 : 0);

  return {
    filters,
    setFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    sortCol,
    sortDir,
    handleSort,
    characterNameCounts,
    effectOptions,
    tierOptions,
    selectedTierListName,
    getTierLabel,
    filteredAndSorted,
    pageItems,
    page,
    setPage,
    totalPages,
    activeFilterCount,
  };
}
