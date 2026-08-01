import SafeImage from '@/components/ui/SafeImage';
import { getSubclassIcon } from '@/assets';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import { createClassFilterGroup } from '@/components/common/EntityFilterGroups';
import FilteredListShell from '@/components/layout/FilteredListShell';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal from '@/components/tools/SuggestModal';
import { CLASS_ORDER } from '@/constants/class-colors';
import { QUALITY_ORDER } from '@/constants/quality';
import { SUBCLASS_FIELDS } from '@/features/wiki/subclasses/form-fields';
import SubclassUsageTab, {
  type SubclassUsage,
  type SubclassUsageQualityFilter,
} from '@/features/wiki/subclasses/components/SubclassUsageTab';
import RichText from '@/components/common/RichText';
import SortableTh from '@/components/ui/SortableTh';
import { getCardHoverProps, getMinWidthStyle } from '@/constants/styles';
import { IMAGE_SIZE, PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import ClassTag from '@/components/ui/ClassTag';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import type { CharacterClass } from '@/features/characters/types';
import TierBadge from '@/components/ui/TierBadge';
import { useStatusEffects, useSubclasses } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilterPanel,
  useFilteredPageData,
  useGradientAccent,
  useMobileTooltip,
  useSecondaryTabList,
  useSearchParamFilter,
  useTabParam,
} from '@/hooks';
import { getLatestTimestamp, readStoredJson, writeStoredJson } from '@/utils';
import { getClassRank } from '@/utils/class-order';
import {
  Badge,
  Container,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
} from '@mantine/core';
import { useCallback, useEffect, useMemo, useState } from 'react';

const USAGE_QUALITY_OPTIONS: {
  value: SubclassUsageQualityFilter;
  label: string;
}[] = [
  { value: 'ssr-plus', label: 'SSR+ and above' },
  { value: 'ssr', label: 'SSR and above' },
  { value: 'all', label: 'All characters' },
];

const USAGE_QUALITY_THRESHOLD: Record<SubclassUsageQualityFilter, number> = {
  'ssr-plus': QUALITY_ORDER.indexOf('SSR+'),
  ssr: QUALITY_ORDER.indexOf('SSR'),
  all: QUALITY_ORDER.length - 1,
};

const DEFAULT_USAGE_QUALITY_FILTER: SubclassUsageQualityFilter = 'ssr-plus';

interface SubclassFilters {
  search: string;
  classes: CharacterClass[];
  tiers: string[];
}

const EMPTY_FILTERS: SubclassFilters = {
  search: '',
  classes: [],
  tiers: [],
};

const FILTER_GROUPS: ChipFilterGroup[] = [
  createClassFilterGroup(),
  {
    key: 'tiers',
    label: 'Tier',
    options: ['1', '2', '3'],
  },
];

export default function Subclasses() {
  const { accent } = useGradientAccent();
  const tooltipProps = useMobileTooltip();
  const { isOpen: usageFilterOpen, toggle: toggleUsageFilter } =
    useFilterPanel();
  const [activeTab, handleTabChange] = useTabParam('tab', 'subclasses', [
    'subclasses',
    'usage',
  ]);
  const {
    data: subclasses,
    loading,
    error,
    retry,
  } = useSubclasses();
  const {
    data: characters,
    loading: charactersLoading,
    error: charactersError,
  } = useCharacters();
  const { data: statusEffects } = useStatusEffects();

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
    pageItems,
    filtered,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    pageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(subclasses, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.SUBCLASS_FILTERS,
      viewMode: STORAGE_KEY.SUBCLASS_VIEW_MODE,
      sort: STORAGE_KEY.SUBCLASS_SORT,
    },
    defaultViewMode: 'list',
    filterFn: (item, filters) => {
      if (
        filters.search &&
        !item.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.classes.length > 0 && !filters.classes.includes(item.class)) {
        return false;
      }
      if (
        filters.tiers.length > 0 &&
        !filters.tiers.includes(String(item.tier))
      ) {
        return false;
      }
      return true;
    },
    sortFn: (a, b, col, dir) => {
      if (col) {
        let cmp = 0;
        if (col === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (col === 'class') {
          cmp = getClassRank(a.class) - getClassRank(b.class);
        } else if (col === 'tier') {
          cmp = a.tier - b.tier;
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }
      const classCmp = getClassRank(a.class) - getClassRank(b.class);
      if (classCmp !== 0) return classCmp;
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    },
  });
  useSearchParamFilter(setFilters);

  const [usageQualityFilter, setUsageQualityFilter] =
    useState<SubclassUsageQualityFilter>(() => {
      if (typeof window === 'undefined') return DEFAULT_USAGE_QUALITY_FILTER;
      const stored = window.localStorage.getItem(
        STORAGE_KEY.SUBCLASS_USAGE_QUALITY_FILTER
      );
      return USAGE_QUALITY_OPTIONS.some((option) => option.value === stored)
        ? (stored as SubclassUsageQualityFilter)
        : DEFAULT_USAGE_QUALITY_FILTER;
    });
  const [usageClasses, setUsageClasses] = useState<CharacterClass[]>(() =>
    readStoredJson(
      STORAGE_KEY.SUBCLASS_USAGE_CLASSES,
      [],
      (value): value is CharacterClass[] =>
        Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === 'string' &&
            CLASS_ORDER.includes(item as CharacterClass)
        )
    )
  );

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY.SUBCLASS_USAGE_QUALITY_FILTER,
      usageQualityFilter
    );
  }, [usageQualityFilter]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEY.SUBCLASS_USAGE_CLASSES, usageClasses);
  }, [usageClasses]);

  const usageEligibleCharacters = useMemo(() => {
    const threshold = USAGE_QUALITY_THRESHOLD[usageQualityFilter];
    return characters.filter(
      (character) => QUALITY_ORDER.indexOf(character.quality) <= threshold
    );
  }, [characters, usageQualityFilter]);

  const subclassUsage = useMemo<SubclassUsage[]>(() => {
    const subclassByReference = new Map(
      subclasses.map((subclass) => [subclass.slug, subclass])
    );
    const charactersBySubclass = new Map<string, typeof characters>();

    for (const character of usageEligibleCharacters) {
      const references = new Set(character.recommended_subclasses ?? []);
      for (const reference of references) {
        const subclass = subclassByReference.get(reference);
        if (!subclass) continue;

        const usingCharacters = charactersBySubclass.get(subclass.slug) ?? [];
        usingCharacters.push(character);
        charactersBySubclass.set(subclass.slug, usingCharacters);
      }
    }

    return subclasses
      .map((item) => {
        const usingCharacters = [
          ...(charactersBySubclass.get(item.slug) ?? []),
        ].sort(
          (a, b) =>
            QUALITY_ORDER.indexOf(a.quality) -
              QUALITY_ORDER.indexOf(b.quality) ||
            a.name.localeCompare(b.name)
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
  }, [subclasses, usageEligibleCharacters]);

  const usageSearchFn = useCallback(
    (entry: SubclassUsage, query: string) =>
      entry.item.name.toLowerCase().includes(query) ||
      entry.item.class.toLowerCase().includes(query),
    []
  );

  const usageWithClassFilter = useMemo(
    () =>
      usageClasses.length === 0
        ? subclassUsage
        : subclassUsage.filter(({ item }) => usageClasses.includes(item.class)),
    [subclassUsage, usageClasses]
  );

  const usageSortFn = useCallback(
    (
      a: SubclassUsage,
      b: SubclassUsage,
      col: string | null,
      dir: 'asc' | 'desc'
    ) => {
      let cmp: number;
      if (col === 'name') {
        cmp = a.item.name.localeCompare(b.item.name);
      } else if (col === 'class') {
        cmp =
          getClassRank(a.item.class) - getClassRank(b.item.class) ||
          a.item.name.localeCompare(b.item.name);
      } else if (col === 'tier') {
        cmp = a.item.tier - b.item.tier || a.item.name.localeCompare(b.item.name);
      } else if (col === 'count') {
        cmp = a.count - b.count;
      } else {
        return 0;
      }
      return applyDir(cmp, dir);
    },
    []
  );

  const {
    search: usageSearch,
    setSearch: setUsageSearch,
    sortCol: usageSortCol,
    sortDir: usageSortDir,
    handleSort: handleUsageSort,
    filtered: filteredUsage,
    pageItems: usagePageItems,
    page: usagePage,
    setPage: setUsagePage,
    totalPages: usageTotalPages,
    pageSize: usagePageSize,
    setPageSize: setUsagePageSize,
    pageSizeOptions: usagePageSizeOptions,
  } = useSecondaryTabList(usageWithClassFilter, {
    searchFn: usageSearchFn,
    sortFn: usageSortFn,
    storageKeys: {
      search: STORAGE_KEY.SUBCLASS_USAGE_SEARCH,
      sort: STORAGE_KEY.SUBCLASS_USAGE_SORT,
    },
    pageSize: PAGE_SIZE,
    extraPaginationKey: `${usageQualityFilter}|${usageClasses.join(',')}`,
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
    (usageQualityFilter !== DEFAULT_USAGE_QUALITY_FILTER ? 1 : 0) +
    usageClasses.length;

  const resetUsageFilters = () => {
    setUsageSearch('');
    setUsageQualityFilter(DEFAULT_USAGE_QUALITY_FILTER);
    setUsageClasses([]);
  };

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(subclasses),
    [subclasses]
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Subclasses" timestamp={mostRecentUpdate}>
          {activeTab === 'usage' ? null : (
            <Group gap="xs">
              <ExportButton data={subclasses} filename="subclasses.json" />
              <SuggestModal
                buttonLabel="Suggest"
                modalTitle="Suggest a New Subclass"
                issueTitle="[Subclass] New subclass suggestion"
                fields={SUBCLASS_FIELDS}
              />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="subclasses">Subclasses</Tabs.Tab>
            <Tabs.Tab value="usage">Usage</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="subclasses" pt="md">
            <ListPageShell
              loading={loading}
              error={error}
              onRetry={retry}
              errorTitle="Could not load subclasses"
              hasData={subclasses.length > 0}
              emptyMessage="No subclass data available yet."
              loadingFallback={
                <ViewModeLoading
                  viewMode={viewMode}
                  listType="table"
                  withToolbar
                  showPagination
                />
              }
            >
              <FilteredListShell
                count={filtered.length}
                noun="subclass"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
                onResetFilters={resetFilters}
                filterContent={
                  <EntityFilter
                    groups={FILTER_GROUPS}
                    selected={{ classes: filters.classes, tiers: filters.tiers }}
                    onChange={(key, values) => {
                      if (key === 'classes') {
                        setFilters({
                          ...filters,
                          classes: values as CharacterClass[],
                        });
                        return;
                      }
                      setFilters({ ...filters, tiers: values as string[] });
                    }}
                    onClear={resetFilters}
                    search={filters.search}
                    onSearchChange={(value) =>
                      setFilters({ ...filters, search: value })
                    }
                    searchPlaceholder="Search by name..."
              />
            }
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={setPageSize}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {pageItems.map((item) => {
                  const subclassIcon = getSubclassIcon(item.slug, item.class);
                  return (
                    <Paper
                      key={item.name}
                      p="sm"
                      radius="md"
                      withBorder
                      {...getCardHoverProps()}
                    >
                      <Stack gap="xs">
                        <Group gap="sm" wrap="nowrap">
                          {subclassIcon && (
                            <SafeImage
                              src={subclassIcon}
                              alt={item.name}
                              w={IMAGE_SIZE.CARD_ICON_SM}
                              h={IMAGE_SIZE.CARD_ICON_SM}
                              fit="contain"
                              loading="lazy"
                            />
                          )}
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600}>{item.name}</Text>
                            <Group gap="xs" wrap="wrap">
                              <ClassTag characterClass={item.class} size="xs" />
                              <TierBadge
                                tier={String(item.tier)}
                                showPrefix
                                size="xs"
                                index={item.tier - 1}
                              />
                            </Group>
                          </Stack>
                        </Group>

                        {item.bonuses.length > 0 && (
                          <Group gap="xs" wrap="wrap">
                            {item.bonuses.map((bonus) => (
                              <Badge
                                key={bonus}
                                variant="outline"
                                size="xs"
                                color={accent.secondary}
                              >
                                {bonus}
                              </Badge>
                            ))}
                          </Group>
                        )}

                        <RichText
                          text={item.effect}
                          statusEffects={statusEffects}
                        />
                      </Stack>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            }
            tableContent={
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={getMinWidthStyle(860)}>
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
                        sortKey="class"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Class
                      </SortableTh>
                      <SortableTh
                        sortKey="tier"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Tier
                      </SortableTh>
                      <Table.Th>Bonuses</Table.Th>
                      <Table.Th>Effect</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageItems.map((item) => {
                      const subclassIcon = getSubclassIcon(
                        item.name,
                        item.class
                      );
                      return (
                        <Table.Tr key={item.name}>
                          <Table.Td>
                            {subclassIcon && (
                              <SafeImage
                                src={subclassIcon}
                                alt={item.name}
                                w={IMAGE_SIZE.CARD_ICON_SM}
                                h={IMAGE_SIZE.CARD_ICON_SM}
                                fit="contain"
                                loading="lazy"
                              />
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} size="sm">
                              {item.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <ClassTag characterClass={item.class} size="sm" />
                          </Table.Td>
                          <Table.Td>
                            <TierBadge
                              tier={String(item.tier)}
                              showPrefix
                              size="sm"
                              index={item.tier - 1}
                            />
                          </Table.Td>
                          <Table.Td className="table-badge-cell">
                            <Group
                              gap="xs"
                              wrap="wrap"
                              className="table-badge-list"
                            >
                              {item.bonuses.map((bonus) => (
                                <Badge
                                  key={bonus}
                                  variant="outline"
                                  size="xs"
                                  color={accent.secondary}
                                >
                                  {bonus}
                                </Badge>
                              ))}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <RichText
                              text={item.effect}
                              statusEffects={statusEffects}
                            />
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

          <Tabs.Panel value="usage" pt="md">
            <SubclassUsageTab
              loading={loading || charactersLoading}
              error={error || charactersError}
              subclasses={subclasses}
              filteredUsage={filteredUsage}
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
              usageClasses={usageClasses}
              onUsageClassesChange={setUsageClasses}
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
