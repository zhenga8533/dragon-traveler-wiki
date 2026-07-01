import ExpandableText from '@/components/ui/ExpandableText';
import SafeImage from '@/components/ui/SafeImage';
import { GEAR_TYPE_ICON_MAP, getGearIcon } from '@/assets';
import RichText from '@/components/common/RichText';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import EntityTableLinkCell from '@/components/common/EntityTableLinkCell';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import {
  FilterClearButton,
  FilterSearchInput,
  FilterSection,
} from '@/components/common/FilterControls';
import FilteredListShell from '@/components/layout/FilteredListShell';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import SearchableGridPanel from '@/components/layout/SearchableGridPanel';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal, { type FieldDef } from '@/components/tools/SuggestModal';
import {
  GEAR_SET_FIELDS,
  GEAR_STATS_ARRAY_FIELDS,
} from '@/features/wiki/gear/form-fields';
import SortableTh from '@/components/ui/SortableTh';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import PaginationControl from '@/components/ui/PaginationControl';
import { StaticSurface } from '@/components/ui/Surface';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import {
  getCharacterRoutePath,
  getCharacterRouteSlug,
} from '@/features/characters/utils/character-route';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { GEAR_TYPE_ORDER } from '@/constants/gear-colors';
import { QUALITY_ORDER } from '@/constants/quality';
import {
  CURSOR_POINTER_STYLE,
  LINK_BLOCK_RESET_STYLE,
  getCardHoverProps,
  getMinWidthStyle,
} from '@/constants/styles';
import { IMAGE_SIZE, PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import QualityIcon from '@/components/ui/QualityIcon';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import type { Gear, GearType } from '@/features/wiki/gear/types';
import { useGear, useGearSets, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilterPanel,
  useFilteredPageData,
  useGradientAccent,
  useMobileTooltip,
  usePageSize,
  useSortState,
  useTabParam,
} from '@/hooks';
import { getPageSizeStorageKey, usePagination } from '@/hooks/use-pagination';
import type { Quality } from '@/types/quality';
import { getLatestTimestamp } from '@/utils';

import {
  Badge,
  Container,
  Group,
  Paper,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type UsageQualityFilter = 'ssr-plus' | 'ssr' | 'all';

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

interface GearFilters {
  search: string;
  types: GearType[];
  qualities: Quality[];
}

const EMPTY_FILTERS: GearFilters = {
  search: '',
  types: [],
  qualities: [],
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

  const gearSetOptions = useMemo(
    () =>
      [...new Set(gearSets.map((entry) => entry.name))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [gearSets]
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
        filters.qualities.length === 0
      ) {
        return true;
      }
      const query = filters.search.toLowerCase();
      const matchesSearch =
        !filters.search ||
        item.name.toLowerCase().includes(query) ||
        item.set.toLowerCase().includes(query);
      const matchesType =
        filters.types.length === 0 || filters.types.includes(item.type);
      const matchesQuality =
        filters.qualities.length === 0 ||
        filters.qualities.includes(item.quality);
      return matchesSearch && matchesType && matchesQuality;
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
          cmp = a.set.localeCompare(b.set);
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

  const gearSetByName = useMemo(
    () => new Map(gearSets.map((entry) => [entry.slug, entry])),
    [gearSets]
  );

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

  const gearItemUsage = useMemo(() => {
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

  const { sortState: usageSortState, handleSort: handleUsageSort } =
    useSortState(STORAGE_KEY.GEAR_USAGE_SORT);
  const { col: usageSortCol, dir: usageSortDir } = usageSortState;

  const sortedGearItemUsage = useMemo(() => {
    if (!usageSortCol) return gearItemUsage;
    const sorted = [...gearItemUsage].sort((a, b) => {
      let cmp = 0;
      if (usageSortCol === 'name') {
        cmp = a.item.name.localeCompare(b.item.name);
      } else if (usageSortCol === 'type') {
        cmp =
          GEAR_TYPE_ORDER.indexOf(a.item.type) -
            GEAR_TYPE_ORDER.indexOf(b.item.type) ||
          a.item.name.localeCompare(b.item.name);
      } else if (usageSortCol === 'set') {
        cmp =
          a.item.set.localeCompare(b.item.set) ||
          a.item.name.localeCompare(b.item.name);
      } else {
        cmp = a.count - b.count;
      }
      return applyDir(cmp, usageSortDir);
    });
    return sorted;
  }, [gearItemUsage, usageSortCol, usageSortDir]);

  const [usageSearch, setUsageSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.GEAR_USAGE_SEARCH) || '';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.GEAR_USAGE_SEARCH, usageSearch);
  }, [usageSearch]);

  const filteredGearItemUsage = useMemo(() => {
    const query = usageSearch.trim().toLowerCase();
    if (!query) return sortedGearItemUsage;
    return sortedGearItemUsage.filter(
      (entry) =>
        entry.item.name.toLowerCase().includes(query) ||
        entry.item.set.toLowerCase().includes(query)
    );
  }, [sortedGearItemUsage, usageSearch]);

  const {
    pageSize: usagePageSize,
    setPageSize: setUsagePageSize,
    pageSizeOptions: usagePageSizeOptions,
  } = usePageSize([10, 20, 30, 50], {
    defaultSize: PAGE_SIZE,
    storageKey: getPageSizeStorageKey(STORAGE_KEY.GEAR_USAGE_SEARCH),
  });

  const usagePaginationKey = `${usageSearch}|${usageQualityFilter}|${usageSortCol}|${usageSortDir}`;

  const {
    page: usagePage,
    setPage: setUsagePage,
    totalPages: usageTotalPages,
    offset: usageOffset,
  } = usePagination(filteredGearItemUsage.length, usagePageSize, usagePaginationKey);

  useEffect(() => {
    setUsagePage(1);
  }, [usagePageSize, setUsagePage]);

  const usagePageItems = filteredGearItemUsage.slice(
    usageOffset,
    usageOffset + usagePageSize
  );

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

  const [gearSetSearch, setGearSetSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.GEAR_SET_SEARCH) || '';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.GEAR_SET_SEARCH, gearSetSearch);
  }, [gearSetSearch]);

  const filteredGearSets = useMemo(() => {
    const query = gearSetSearch.trim().toLowerCase();
    return gearSets
      .filter((set) => {
        if (!query) return true;
        const bonusDesc = set.set_bonus?.description ?? '';
        return (
          set.name.toLowerCase().includes(query) ||
          bonusDesc.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [gearSets, gearSetSearch]);

  const {
    pageSize: gearSetPageSize,
    setPageSize: setGearSetPageSize,
    pageSizeOptions: gearSetPageSizeOptions,
  } = usePageSize([10, 20, 30, 50], {
    defaultSize: PAGE_SIZE,
    storageKey: getPageSizeStorageKey(STORAGE_KEY.GEAR_SET_SEARCH),
  });

  const {
    page: gearSetPage,
    setPage: setGearSetPage,
    totalPages: gearSetTotalPages,
    offset: gearSetOffset,
  } = usePagination(filteredGearSets.length, gearSetPageSize, gearSetSearch);

  useEffect(() => {
    setGearSetPage(1);
  }, [gearSetPageSize, setGearSetPage]);

  const gearSetPageItems = filteredGearSets.slice(
    gearSetOffset,
    gearSetOffset + gearSetPageSize
  );

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
            <ListPageShell
              loading={loading}
              error={error}
              errorTitle="Could not load gear"
              hasData={gear.length > 0}
              emptyMessage="No gear data available yet."
              skeletonCards={4}
            >
              <FilteredListShell
                count={filtered.length}
                noun="gear item"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
                onResetFilters={resetFilters}
                emptyMessage="No gear matches the current filters."
                page={gearPage}
                totalPages={gearTotalPages}
                onPageChange={setGearPage}
                pageSize={gearPageSize}
                pageSizeOptions={gearPageSizeOptions}
                onPageSizeChange={setGearPageSize}
                filterContent={
                  <EntityFilter
                    groups={FILTER_GROUPS}
                    selected={{
                      types: filters.types,
                      qualities: filters.qualities,
                    }}
                    onChange={(key, values) => {
                      if (key === 'types') {
                        setFilters({
                          ...filters,
                          types: values as GearType[],
                        });
                        return;
                      }
                      if (key === 'qualities') {
                        setFilters({
                          ...filters,
                          qualities: values as Quality[],
                        });
                      }
                    }}
                    onClear={() => setFilters(EMPTY_FILTERS)}
                    search={filters.search}
                    onSearchChange={(value) =>
                      setFilters({ ...filters, search: value })
                    }
                    searchPlaceholder="Search by gear or set..."
                  />
                }
                gridContent={
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {gearPageItems.map((item) => {
                      const setData = gearSetByName.get(item.set);
                      const setBonus = setData?.set_bonus ?? item.set_bonus;
                      const iconSrc = getGearIcon(item.type, item.slug);
                      return (
                        <Paper
                          key={item.name}
                          component={Link}
                          to={`/gear-sets/${item.set}`}
                          p="md"
                          radius="md"
                          withBorder
                          {...getCardHoverProps({
                            interactive: true,
                            style: LINK_BLOCK_RESET_STYLE,
                          })}
                        >
                          <Group gap="md" align="flex-start" wrap="nowrap">
                            {iconSrc && (
                              <SafeImage
                                src={iconSrc}
                                alt={item.name}
                                w={IMAGE_SIZE.CARD_ICON}
                                h={IMAGE_SIZE.CARD_ICON}
                                fit="contain"
                                radius="sm"
                              />
                            )}
                            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                              <Group gap="sm" wrap="wrap">
                                <Text
                                  fw={700}
                                  className="dt-link-text"
                                  lineClamp={1}
                                >
                                  {item.name}
                                </Text>
                                {item.quality && (
                                  <QualityIcon quality={item.quality} />
                                )}
                              </Group>
                              <Group gap="xs" wrap="wrap">
                                <GearTypeTag type={item.type} />
                                <Badge
                                  variant="light"
                                  size="sm"
                                  color={accent.secondary}
                                >
                                  {item.set}
                                </Badge>
                                {setBonus && setBonus.quantity > 0 && (
                                  <Badge
                                    variant="outline"
                                    size="sm"
                                    color={accent.tertiary}
                                  >
                                    {setBonus.quantity}-piece set
                                  </Badge>
                                )}
                              </Group>
                              <ExpandableText size="xs">
                                <RichText text={item.lore} statusEffects={statusEffects} italic />
                              </ExpandableText>
                            </Stack>
                          </Group>
                        </Paper>
                      );
                    })}
                  </SimpleGrid>
                }
                tableContent={
                  <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                    <Table
                      striped
                      highlightOnHover
                      style={getMinWidthStyle(800)}
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Icon</Table.Th>
                          <SortableTh
                            sortKey="name"
                            sortCol={sortCol}
                            sortDir={sortDir}
                            onSort={handleSort}
                          >
                            Name
                          </SortableTh>
                          <SortableTh
                            sortKey="type"
                            sortCol={sortCol}
                            sortDir={sortDir}
                            onSort={handleSort}
                          >
                            Type
                          </SortableTh>
                          <SortableTh
                            sortKey="set"
                            sortCol={sortCol}
                            sortDir={sortDir}
                            onSort={handleSort}
                          >
                            Set
                          </SortableTh>
                          <SortableTh
                            sortKey="rarity"
                            sortCol={sortCol}
                            sortDir={sortDir}
                            onSort={handleSort}
                          >
                            Rarity
                          </SortableTh>
                          <Table.Th>Set Bonus</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {gearPageItems.map((item) => {
                          const setData = gearSetByName.get(item.set);
                          const setBonus = setData?.set_bonus ?? item.set_bonus;
                          const iconSrc = getGearIcon(item.type, item.slug);
                          return (
                            <Table.Tr key={item.name}>
                              <Table.Td>
                                {iconSrc && (
                                  <SafeImage
                                    src={iconSrc}
                                    alt={item.name}
                                    w={IMAGE_SIZE.PORTRAIT_SM}
                                    h={IMAGE_SIZE.PORTRAIT_SM}
                                    fit="contain"
                                    loading="lazy"
                                  />
                                )}
                              </Table.Td>
                              <EntityTableLinkCell
                                to={`/gear-sets/${item.set}`}
                              >
                                {item.name}
                              </EntityTableLinkCell>
                              <Table.Td>
                                <GearTypeTag type={item.type} />
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  variant="light"
                                  size="sm"
                                  color={accent.secondary}
                                >
                                  {item.set}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                {item.quality && (
                                  <QualityIcon quality={item.quality} />
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed">
                                  {setBonus && setBonus.quantity > 0 ? (
                                    <>{setBonus.quantity}-piece:{' '}
                                      <RichText text={setBonus.description} statusEffects={statusEffects} />
                                    </>
                                  ) : '—'}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                }
              />
            </ListPageShell>
          </Tabs.Panel>

          <Tabs.Panel value="gear-sets" pt="md">
            <ListPageShell
              loading={gearSetsLoading}
              error={gearSetsError}
              errorTitle="Could not load gear sets"
              hasData={gearSets.length > 0}
              emptyMessage="No gear set data available yet."
              skeletonCards={4}
            >
              <SearchableGridPanel
                search={gearSetSearch}
                onSearchChange={setGearSetSearch}
                searchPlaceholder="Search by set name or bonus..."
                hasResults={filteredGearSets.length > 0}
                noResultsTitle="No gear sets found"
                noResultsMessage="No gear sets match the search."
                onResetSearch={() => setGearSetSearch('')}
                currentPage={gearSetPage}
                totalPages={gearSetTotalPages}
                onPageChange={setGearSetPage}
                totalItems={filteredGearSets.length}
                pageSize={gearSetPageSize}
                pageSizeOptions={gearSetPageSizeOptions}
                onPageSizeChange={setGearSetPageSize}
              >
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {gearSetPageItems.map((set) => {
                        const items = gearItemsBySet.get(set.slug) ?? [];
                        const setBonus = set.set_bonus;
                        const bonusQuantity = setBonus?.quantity ?? 0;
                        const bonusDescription = setBonus?.description ?? '';
                        return (
                          <Paper
                            key={set.name}
                            component={Link}
                            to={`/gear-sets/${set.slug}`}
                            p="md"
                            radius="md"
                            withBorder
                            {...getCardHoverProps({
                              interactive: true,
                              style: LINK_BLOCK_RESET_STYLE,
                            })}
                          >
                            <Stack gap="xs">
                              <Group justify="space-between" align="center">
                                <Text
                                  fw={700}
                                  className="dt-link-text"
                                  lineClamp={1}
                                >
                                  {set.name}
                                </Text>
                                {bonusQuantity > 0 && (
                                  <Badge
                                    variant="light"
                                    size="sm"
                                    color={accent.tertiary}
                                  >
                                    {bonusQuantity}-piece
                                  </Badge>
                                )}
                              </Group>

                              <Text size="sm" c="dimmed">
                                {bonusQuantity > 0
                                  ? bonusDescription ||
                                    'No set bonus description.'
                                  : 'No set bonus.'}
                              </Text>

                              <Group gap="xs" wrap="wrap">
                                <Badge
                                  variant="light"
                                  size="sm"
                                  color={accent.secondary}
                                >
                                  {items.length} item
                                  {items.length === 1 ? '' : 's'}
                                </Badge>
                                {items.slice(0, 4).map((item) => (
                                  <GearTypeTag
                                    key={item.name}
                                    type={item.type}
                                  />
                                ))}
                              </Group>
                            </Stack>
                          </Paper>
                        );
                      })}
                </SimpleGrid>
              </SearchableGridPanel>
            </ListPageShell>
          </Tabs.Panel>

          <Tabs.Panel value="usage" pt="md">
            <ListPageShell
              loading={loading || gearSetsLoading || charactersLoading}
              error={error || gearSetsError || charactersError}
              errorTitle="Could not load gear usage"
              hasData={gearSets.length > 0}
              emptyMessage="No gear set data available yet."
              skeletonCards={4}
            >
              <StaticSurface p="md" data-no-hover>
                <Stack gap="md">
                  <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                    <Text size="sm" c="dimmed">
                      {filteredGearItemUsage.length} gear item
                      {filteredGearItemUsage.length !== 1 ? 's' : ''} · based on{' '}
                      {usageEligibleCharacters.length} character
                      {usageEligibleCharacters.length === 1 ? '' : 's'}
                    </Text>
                    <FilterPopoverButton
                      filterCount={usageFilterCount}
                      filterOpen={usageFilterOpen}
                      onFilterToggle={toggleUsageFilter}
                    >
                      <Stack gap={8}>
                        <Group gap="xs" align="center" wrap="wrap">
                          <FilterSearchInput
                            placeholder="Search by gear or set..."
                            value={usageSearch}
                            onSearch={setUsageSearch}
                            size="xs"
                            style={{ flex: 1, minWidth: 180 }}
                          />
                          {usageFilterCount > 0 && (
                            <FilterClearButton
                              size="compact-xs"
                              onClick={resetUsageFilters}
                            />
                          )}
                        </Group>
                        <FilterSection label="Quality">
                          <SegmentedControl
                            value={usageQualityFilter}
                            onChange={(value) =>
                              setUsageQualityFilter(value as UsageQualityFilter)
                            }
                            data={USAGE_QUALITY_OPTIONS.map((option) => ({
                              value: option.value,
                              label: option.label,
                            }))}
                            color={accent.primary}
                            size="xs"
                          />
                        </FilterSection>
                      </Stack>
                    </FilterPopoverButton>
                  </Group>

                  {filteredGearItemUsage.length === 0 ? (
                    <NoResultsSuggestions
                      title="No gear found"
                      message="No gear matches the current filters."
                      onReset={resetUsageFilters}
                      onOpenFilters={toggleUsageFilter}
                    />
                  ) : (
                    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                      <Table
                        striped
                        highlightOnHover
                        style={getMinWidthStyle(800)}
                      >
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Icon</Table.Th>
                            <SortableTh
                              sortKey="name"
                              sortCol={usageSortCol}
                              sortDir={usageSortDir}
                              onSort={handleUsageSort}
                            >
                              Name
                            </SortableTh>
                            <SortableTh
                              sortKey="type"
                              sortCol={usageSortCol}
                              sortDir={usageSortDir}
                              onSort={handleUsageSort}
                            >
                              Type
                            </SortableTh>
                            <SortableTh
                              sortKey="set"
                              sortCol={usageSortCol}
                              sortDir={usageSortDir}
                              onSort={handleUsageSort}
                            >
                              Set
                            </SortableTh>
                            <SortableTh
                              sortKey="count"
                              sortCol={usageSortCol}
                              sortDir={usageSortDir}
                              onSort={handleUsageSort}
                            >
                              Characters
                            </SortableTh>
                            <Table.Th>Used By</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {usagePageItems.map(
                            ({ item, characters: usingCharacters, count, percentage }) => {
                              const iconSrc = getGearIcon(item.type, item.slug);
                              return (
                                <Table.Tr key={item.name}>
                                  <Table.Td>
                                    {iconSrc && (
                                      <SafeImage
                                        src={iconSrc}
                                        alt={item.name}
                                        w={IMAGE_SIZE.PORTRAIT_SM}
                                        h={IMAGE_SIZE.PORTRAIT_SM}
                                        fit="contain"
                                        loading="lazy"
                                      />
                                    )}
                                  </Table.Td>
                                  <EntityTableLinkCell to={`/gear-sets/${item.set}`}>
                                    {item.name}
                                  </EntityTableLinkCell>
                                  <Table.Td>
                                    <GearTypeTag type={item.type} />
                                  </Table.Td>
                                  <Table.Td>
                                    <Badge
                                      variant="light"
                                      size="sm"
                                      color={accent.secondary}
                                    >
                                      {item.set}
                                    </Badge>
                                  </Table.Td>
                                  <Table.Td>
                                    <Badge
                                      variant="light"
                                      size="sm"
                                      color={accent.tertiary}
                                    >
                                      {count} ({percentage}%)
                                    </Badge>
                                  </Table.Td>
                                  <Table.Td>
                                    {usingCharacters.length > 0 ? (
                                      (() => {
                                        const isExpanded = expandedUsageItems.has(
                                          item.slug
                                        );
                                        const shown = isExpanded
                                          ? usingCharacters
                                          : usingCharacters.slice(0, 6);
                                        const remaining =
                                          usingCharacters.length - 6;
                                        return (
                                          <Group gap={4} wrap="wrap">
                                            {shown.map((character) => (
                                              <CharacterPortrait
                                                key={`${item.name}-${character.name}-${character.quality}`}
                                                name={character.name}
                                                size={32}
                                                quality={character.quality}
                                                assetKey={getCharacterRouteSlug(character)}
                                                routePath={getCharacterRoutePath(character)}
                                                link
                                                tooltip={character.name}
                                                tooltipProps={tooltipProps}
                                              />
                                            ))}
                                            {remaining > 0 && (
                                              <Badge
                                                variant="light"
                                                color="gray"
                                                size="sm"
                                                style={CURSOR_POINTER_STYLE}
                                                onClick={() =>
                                                  toggleExpandedUsageItem(item.slug)
                                                }
                                              >
                                                {isExpanded
                                                  ? 'Show less'
                                                  : `+${remaining} more`}
                                              </Badge>
                                            )}
                                          </Group>
                                        );
                                      })()
                                    ) : (
                                      <Text size="sm" c="dimmed">
                                        —
                                      </Text>
                                    )}
                                  </Table.Td>
                                </Table.Tr>
                              );
                            }
                          )}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  )}

                  <PaginationControl
                    currentPage={usagePage}
                    totalPages={usageTotalPages}
                    onChange={setUsagePage}
                    totalItems={filteredGearItemUsage.length}
                    pageSize={usagePageSize}
                    pageSizeOptions={usagePageSizeOptions}
                    onPageSizeChange={setUsagePageSize}
                  />
                </Stack>
              </StaticSurface>
            </ListPageShell>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
