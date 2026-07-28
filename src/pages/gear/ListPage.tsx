import SafeImage from '@/components/ui/SafeImage';
import { GEAR_TYPE_ICON_MAP } from '@/assets';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal, { type FieldDef } from '@/components/tools/SuggestModal';
import {
  GEAR_SET_FIELDS,
  GEAR_STATS_ARRAY_FIELDS,
} from '@/features/wiki/gear/form-fields';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { GEAR_TYPE_ORDER } from '@/constants/gear-colors';
import { QUALITY_ORDER } from '@/constants/quality';
import { STORAGE_KEY, PAGE_SIZE } from '@/constants/ui';
import GearTab, {
  type GearFilters,
} from '@/features/wiki/gear/components/GearTab';
import GearSetsTab from '@/features/wiki/gear/components/GearSetsTab';
import GearUsageTab, {
  type GearItemUsage,
  type UsageQualityFilter,
} from '@/features/wiki/gear/components/GearUsageTab';
import type { Gear, GearSet, GearType } from '@/features/wiki/gear/types';
import { useGear, useGearSets, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilterPanel,
  useFilteredPageData,
  useGradientAccent,
  useMobileTooltip,
  useSecondaryTabList,
  useTabParam,
} from '@/hooks';
import { getLatestTimestamp } from '@/utils';

import { Container, Group, Stack, Tabs } from '@mantine/core';
import { useCallback, useEffect, useMemo, useState } from 'react';

const USAGE_QUALITY_OPTIONS: { value: UsageQualityFilter; label: string }[] = [
  { value: 'ssr-plus', label: 'SSR+ and above' },
  { value: 'ssr', label: 'SSR and above' },
  { value: 'all', label: 'All characters' },
];

const USAGE_QUALITY_THRESHOLD: Record<UsageQualityFilter, number> = {
  'ssr-plus': QUALITY_ORDER.indexOf('SSR+'),
  ssr: QUALITY_ORDER.indexOf('SSR'),
  all: QUALITY_ORDER.length - 1,
};

const DEFAULT_USAGE_QUALITY_FILTER: UsageQualityFilter = 'ssr-plus';

const EMPTY_FILTERS: GearFilters = {
  search: '',
  types: [],
  qualities: [],
  sets: [],
};

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'types',
    label: 'Type',
    options: [...GEAR_TYPE_ORDER],
    icon: (value: string) => {
      const iconSrc = GEAR_TYPE_ICON_MAP[value as GearType];
      if (!iconSrc) return null;
      return <SafeImage src={iconSrc} alt={value} w={14} h={14} fit="contain" />;
    },
  },
  {
    ...createQualityFilterGroup(),
  },
];

export default function GearPage() {
  const { accent } = useGradientAccent();
  const tooltipProps = useMobileTooltip();
  const { isOpen: usageFilterOpen, toggle: toggleUsageFilter } =
    useFilterPanel();
  const [activeTab, handleTabChange] = useTabParam('tab', 'gear', [
    'gear',
    'gear-sets',
    'usage',
  ]);

  const {
    data: gear,
    loading,
    error,
  } = useGear();
  const {
    data: gearSets,
    loading: gearSetsLoading,
    error: gearSetsError,
  } = useGearSets();
  const {
    data: characters,
    loading: charactersLoading,
    error: charactersError,
  } = useCharacters();
  const { data: statusEffects } = useStatusEffects();

  const gearSetBySlug = useMemo(
    () => new Map(gearSets.map((entry) => [entry.slug, entry])),
    [gearSets]
  );

  const gearSetOptions = useMemo(
    () =>
      [...new Set(gearSets.map((entry) => entry.name))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [gearSets]
  );
  const gearSetFilterOptions = useMemo(
    () =>
      [...new Set(gear.map((item) => item.set))]
        .map((setSlug) => ({
          value: setSlug,
          label: gearSetBySlug.get(setSlug)?.name ?? setSlug,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [gear, gearSetBySlug]
  );

  const gearFields = useMemo<FieldDef[]>(
    () => [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Gear name',
      },
      {
        name: 'set',
        label: 'Set',
        type: 'select',
        required: true,
        options: gearSetOptions,
        placeholder: 'Select a gear set',
      },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: GEAR_TYPE_ORDER,
      },
      {
        name: 'quality',
        label: 'Quality',
        type: 'select',
        required: true,
        options: QUALITY_ORDER,
      },
      {
        name: 'lore',
        label: 'Lore',
        type: 'textarea',
        required: true,
        placeholder: 'Gear lore text',
      },
    ],
    [gearSetOptions]
  );

  const {
    filters,
    setFilters,
    resetFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    sortCol,
    sortDir,
    handleSort,
    pageItems: gearPageItems,
    filtered,
    page: gearPage,
    setPage: setGearPage,
    totalPages: gearTotalPages,
    pageSize: gearPageSize,
    setPageSize: setGearPageSize,
    pageSizeOptions: gearPageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(gear, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.GEAR_FILTERS,
      viewMode: STORAGE_KEY.GEAR_VIEW_MODE,
      sort: STORAGE_KEY.GEAR_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (item, filters) => {
      if (
        !filters.search &&
        filters.types.length === 0 &&
        filters.qualities.length === 0 &&
        filters.sets.length === 0
      ) {
        return true;
      }
      const query = filters.search.toLowerCase();
      const matchesSearch =
        !filters.search ||
        item.name.toLowerCase().includes(query) ||
        item.set.toLowerCase().includes(query) ||
        (gearSetBySlug.get(item.set)?.name ?? '')
          .toLowerCase()
          .includes(query);
      const matchesType =
        filters.types.length === 0 || filters.types.includes(item.type);
      const matchesQuality =
        filters.qualities.length === 0 ||
        filters.qualities.includes(item.quality);
      const matchesSet =
        filters.sets.length === 0 || filters.sets.includes(item.set);
      return matchesSearch && matchesType && matchesQuality && matchesSet;
    },
    sortFn: (a, b, col, dir) => {
      const typeCmp =
        GEAR_TYPE_ORDER.indexOf(a.type) - GEAR_TYPE_ORDER.indexOf(b.type);
      const qualityCmp =
        QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
      const nameCmp = a.name.localeCompare(b.name);

      if (col) {
        let cmp = 0;
        if (col === 'name') {
          cmp = nameCmp;
        } else if (col === 'set') {
          cmp = (gearSetBySlug.get(a.set)?.name ?? a.set).localeCompare(
            gearSetBySlug.get(b.set)?.name ?? b.set
          );
        } else if (col === 'type') {
          cmp = typeCmp || qualityCmp || nameCmp;
        } else if (col === 'rarity') {
          cmp = qualityCmp || typeCmp || nameCmp;
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }

      if (typeCmp !== 0) return typeCmp;
      if (qualityCmp !== 0) return qualityCmp;
      return nameCmp;
    },
  });

  const gearItemsBySet = useMemo(() => {
    const map = new Map<string, Gear[]>();
    for (const item of gear) {
      const list = map.get(item.set) ?? [];  // item.set is a slug
      list.push(item);
      map.set(item.set, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const typeCmp =
          GEAR_TYPE_ORDER.indexOf(a.type) - GEAR_TYPE_ORDER.indexOf(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [gear]);

  const [usageQualityFilter, setUsageQualityFilter] =
    useState<UsageQualityFilter>(() => {
      if (typeof window === 'undefined') return DEFAULT_USAGE_QUALITY_FILTER;
      const stored = window.localStorage.getItem(
        STORAGE_KEY.GEAR_USAGE_QUALITY_FILTER
      );
      return USAGE_QUALITY_OPTIONS.some((option) => option.value === stored)
        ? (stored as UsageQualityFilter)
        : DEFAULT_USAGE_QUALITY_FILTER;
    });

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY.GEAR_USAGE_QUALITY_FILTER,
      usageQualityFilter
    );
  }, [usageQualityFilter]);

  const usageEligibleCharacters = useMemo(() => {
    const threshold = USAGE_QUALITY_THRESHOLD[usageQualityFilter];
    return characters.filter(
      (character) => QUALITY_ORDER.indexOf(character.quality) <= threshold
    );
  }, [characters, usageQualityFilter]);

  const gearItemUsage = useMemo<GearItemUsage[]>(() => {
    const charactersByItem = new Map<string, Set<string>>();
    for (const character of usageEligibleCharacters) {
      const usedItems = new Set<string>();
      for (const loadout of character.recommended_gear ?? []) {
        for (const slug of Object.values(loadout.slots)) {
          if (slug) usedItems.add(slug.trim());
        }
      }
      for (const slug of usedItems) {
        const bucket = charactersByItem.get(slug) ?? new Set<string>();
        bucket.add(character.name);
        charactersByItem.set(slug, bucket);
      }
    }

    return gear
      .map((item) => {
        const charNames = Array.from(
          charactersByItem.get(item.slug) ?? []
        );
        const usingCharacters = usageEligibleCharacters
          .filter((character) => charNames.includes(character.name))
          .sort(
            (a, b) =>
              QUALITY_ORDER.indexOf(a.quality) -
                QUALITY_ORDER.indexOf(b.quality) || a.name.localeCompare(b.name)
          );
        return {
          item,
          characters: usingCharacters,
          count: usingCharacters.length,
          percentage: usageEligibleCharacters.length
            ? Math.round(
                (usingCharacters.length / usageEligibleCharacters.length) * 100
              )
            : 0,
        };
      })
      .sort(
        (a, b) => b.count - a.count || a.item.name.localeCompare(b.item.name)
      );
  }, [gear, usageEligibleCharacters]);

  const usageSearchFn = useCallback(
    (entry: (typeof gearItemUsage)[number], query: string) => {
      const setName =
        gearSetBySlug.get(entry.item.set)?.name ?? entry.item.set;
      return (
        entry.item.name.toLowerCase().includes(query) ||
        entry.item.set.toLowerCase().includes(query) ||
        setName.toLowerCase().includes(query)
      );
    },
    [gearSetBySlug]
  );

  const usageSortFn = useCallback(
    (
      a: (typeof gearItemUsage)[number],
      b: (typeof gearItemUsage)[number],
      col: string | null,
      dir: 'asc' | 'desc'
    ) => {
      let cmp = 0;
      if (col === 'name') {
        cmp = a.item.name.localeCompare(b.item.name);
      } else if (col === 'type') {
        cmp =
          GEAR_TYPE_ORDER.indexOf(a.item.type) -
            GEAR_TYPE_ORDER.indexOf(b.item.type) ||
          a.item.name.localeCompare(b.item.name);
      } else if (col === 'set') {
        cmp =
          (
            gearSetBySlug.get(a.item.set)?.name ?? a.item.set
          ).localeCompare(
            gearSetBySlug.get(b.item.set)?.name ?? b.item.set
          ) ||
          a.item.name.localeCompare(b.item.name);
      } else if (col === 'count') {
        cmp = a.count - b.count;
      } else {
        return 0;
      }
      return applyDir(cmp, dir);
    },
    [gearSetBySlug]
  );

  const {
    search: usageSearch,
    setSearch: setUsageSearch,
    sortCol: usageSortCol,
    sortDir: usageSortDir,
    handleSort: handleUsageSort,
    filtered: filteredGearItemUsage,
    pageItems: usagePageItems,
    page: usagePage,
    setPage: setUsagePage,
    totalPages: usageTotalPages,
    pageSize: usagePageSize,
    setPageSize: setUsagePageSize,
    pageSizeOptions: usagePageSizeOptions,
  } = useSecondaryTabList(gearItemUsage, {
    searchFn: usageSearchFn,
    sortFn: usageSortFn,
    storageKeys: {
      search: STORAGE_KEY.GEAR_USAGE_SEARCH,
      sort: STORAGE_KEY.GEAR_USAGE_SORT,
    },
    pageSize: PAGE_SIZE,
    extraPaginationKey: usageQualityFilter,
  });

  const [expandedUsageItems, setExpandedUsageItems] = useState<Set<string>>(
    () => new Set()
  );

  const toggleExpandedUsageItem = (slug: string) => {
    setExpandedUsageItems((current) => {
      const next = new Set(current);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const usageFilterCount =
    (usageSearch ? 1 : 0) +
    (usageQualityFilter !== DEFAULT_USAGE_QUALITY_FILTER ? 1 : 0);

  const resetUsageFilters = () => {
    setUsageSearch('');
    setUsageQualityFilter(DEFAULT_USAGE_QUALITY_FILTER);
  };

  const gearSetSearchFn = useCallback((set: GearSet, query: string) => {
    const bonusDesc = set.set_bonus?.description ?? '';
    return (
      set.name.toLowerCase().includes(query) ||
      bonusDesc.toLowerCase().includes(query)
    );
  }, []);

  const gearSetSortFn = useCallback(
    (a: GearSet, b: GearSet) => a.name.localeCompare(b.name),
    []
  );

  const {
    search: gearSetSearch,
    setSearch: setGearSetSearch,
    filtered: filteredGearSets,
    pageItems: gearSetPageItems,
    page: gearSetPage,
    setPage: setGearSetPage,
    totalPages: gearSetTotalPages,
    pageSize: gearSetPageSize,
    setPageSize: setGearSetPageSize,
    pageSizeOptions: gearSetPageSizeOptions,
  } = useSecondaryTabList(gearSets, {
    searchFn: gearSetSearchFn,
    sortFn: gearSetSortFn,
    storageKeys: { search: STORAGE_KEY.GEAR_SET_SEARCH },
    pageSize: PAGE_SIZE,
  });

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(gear), [gear]);
  const mostRecentSetUpdate = useMemo(
    () => getLatestTimestamp(gearSets),
    [gearSets]
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader
          title="Gear"
          timestamp={
            activeTab === 'gear-sets' ? mostRecentSetUpdate : mostRecentUpdate
          }
        >
          {activeTab === 'gear-sets' ? (
            <Group gap="xs">
              <ExportButton data={gearSets} filename="gear-sets.json" />
              <SuggestModal
                buttonLabel="Suggest"
                modalTitle="Suggest New Gear Set"
                issueTitle="[Gear Set] New gear set suggestion"
                fields={GEAR_SET_FIELDS}
              />
            </Group>
          ) : activeTab === 'usage' ? null : (
            <Group gap="xs">
              <ExportButton data={gear} filename="gear.json" />
              <SuggestModal
                buttonLabel="Suggest"
                modalTitle="Suggest New Gear"
                issueTitle="[Gear] New gear suggestion"
                fields={gearFields}
                arrayFields={GEAR_STATS_ARRAY_FIELDS}
              />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="gear">Gear</Tabs.Tab>
            <Tabs.Tab value="gear-sets">Gear Sets</Tabs.Tab>
            <Tabs.Tab value="usage">Usage</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="gear" pt="md">
            <GearTab
              loading={loading}
              error={error}
              gear={gear}
              filtered={filtered}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              activeFilterCount={activeFilterCount}
              filterOpen={filterOpen}
              onFilterToggle={toggleFilter}
              onResetFilters={resetFilters}
              page={gearPage}
              totalPages={gearTotalPages}
              onPageChange={setGearPage}
              pageSize={gearPageSize}
              pageSizeOptions={gearPageSizeOptions}
              onPageSizeChange={setGearPageSize}
              filters={filters}
              onFiltersChange={setFilters}
              emptyFilters={EMPTY_FILTERS}
              filterGroups={FILTER_GROUPS}
              gearSetOptions={gearSetFilterOptions}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
              pageItems={gearPageItems}
              gearSetBySlug={gearSetBySlug}
              accent={accent}
              statusEffects={statusEffects}
            />
          </Tabs.Panel>

          <Tabs.Panel value="gear-sets" pt="md">
            <GearSetsTab
              loading={gearSetsLoading}
              error={gearSetsError}
              gearSets={gearSets}
              search={gearSetSearch}
              onSearchChange={setGearSetSearch}
              filtered={filteredGearSets}
              page={gearSetPage}
              totalPages={gearSetTotalPages}
              onPageChange={setGearSetPage}
              pageItems={gearSetPageItems}
              pageSize={gearSetPageSize}
              pageSizeOptions={gearSetPageSizeOptions}
              onPageSizeChange={setGearSetPageSize}
              gearItemsBySet={gearItemsBySet}
              accent={accent}
            />
          </Tabs.Panel>

          <Tabs.Panel value="usage" pt="md">
            <GearUsageTab
              loading={loading || gearSetsLoading || charactersLoading}
              error={error || gearSetsError || charactersError}
              gearSets={gearSets}
              gearSetBySlug={gearSetBySlug}
              filteredGearItemUsage={filteredGearItemUsage}
              usageEligibleCharacters={usageEligibleCharacters}
              usageFilterCount={usageFilterCount}
              usageFilterOpen={usageFilterOpen}
              onUsageFilterToggle={toggleUsageFilter}
              usageSearch={usageSearch}
              onUsageSearchChange={setUsageSearch}
              onResetUsageFilters={resetUsageFilters}
              usageQualityFilter={usageQualityFilter}
              onUsageQualityFilterChange={setUsageQualityFilter}
              usageQualityOptions={USAGE_QUALITY_OPTIONS}
              usageSortCol={usageSortCol}
              usageSortDir={usageSortDir}
              onUsageSort={handleUsageSort}
              usagePageItems={usagePageItems}
              expandedUsageItems={expandedUsageItems}
              onToggleExpandedUsageItem={toggleExpandedUsageItem}
              usagePage={usagePage}
              usageTotalPages={usageTotalPages}
              onUsagePageChange={setUsagePage}
              usagePageSize={usagePageSize}
              usagePageSizeOptions={usagePageSizeOptions}
              onUsagePageSizeChange={setUsagePageSize}
              accent={accent}
              tooltipProps={tooltipProps}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
