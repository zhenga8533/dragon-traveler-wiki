import SafeImage from '@/components/ui/SafeImage';
import { getHowlkinIcon } from '@/assets';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import {
  createQualityFilterGroup,
  orderFilterOptions,
} from '@/components/common/EntityFilterGroups';
import FilteredListShell from '@/components/layout/FilteredListShell';
import SearchableGridPanel from '@/components/layout/SearchableGridPanel';
import ListPageHeader from '@/components/layout/ListPageHeader';
import {
  CardGridLoading,
  ViewModeLoading,
} from '@/components/layout/PageLoadingSkeleton';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal from '@/components/tools/SuggestModal';
import {
  GOLDEN_ALLIANCE_EFFECTS_FIELDS,
  GOLDEN_ALLIANCE_FIELDS,
  HOWLKIN_FIELDS,
  HOWLKIN_STATS_FIELDS,
} from '@/features/wiki/howlkins/form-fields';
import DataFetchError from '@/components/ui/DataFetchError';
import EmptyState from '@/components/ui/EmptyState';
import SortableTh from '@/components/ui/SortableTh';
import { QUALITY_ORDER } from '@/constants/colors';
import { LINK_BLOCK_RESET_STYLE, getCardHoverProps, getMinWidthStyle } from '@/constants/styles';
import { PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';

import QualityIcon from '@/components/ui/QualityIcon';
import HowlkinBadge from '@/features/wiki/howlkins/components/HowlkinBadge';
import HowlkinStats from '@/features/wiki/howlkins/components/HowlkinStats';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import { useGoldenAlliances, useHowlkins } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilteredPageData,
  useGradientAccent,
  usePageSize,
  useSearchParamFilter,
  useTabParam,
} from '@/hooks';
import { getPageSizeStorageKey, usePagination } from '@/hooks/use-pagination';
import type { Quality } from '@/types/quality';
import { getLatestTimestamp } from '@/utils';
import SandstormOverlay from '@/components/layout/SandstormOverlay';
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
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface HowlkinFilters {
  search: string;
  qualities: Quality[];
}

const EMPTY_FILTERS: HowlkinFilters = {
  search: '',
  qualities: [],
};

const PHARAOH_NAME = 'Pharaoh Guardian';

export default function Howlkins() {
  const { accent } = useGradientAccent();
  const [shurimaActive, setShurimaActive] = useState(false);
  const [activeTab, handleTabChange] = useTabParam('tab', 'howlkins', [
    'howlkins',
    'golden-alliances',
  ]);

  const {
    data: howlkins,
    loading: howlkinsLoading,
    error: howlkinsError,
  } = useHowlkins();

  const {
    data: goldenAlliances,
    loading: alliancesLoading,
    error: alliancesError,
  } = useGoldenAlliances();

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
    pageItems: howlkinPageItems,
    filtered,
    page: howlkinPage,
    setPage: setHowlkinPage,
    totalPages: howlkinTotalPages,
    pageSize: howlkinPageSize,
    setPageSize: setHowlkinPageSize,
    pageSizeOptions: howlkinPageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(howlkins, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.HOWLKIN_FILTERS,
      viewMode: STORAGE_KEY.HOWLKIN_VIEW_MODE,
      sort: STORAGE_KEY.HOWLKIN_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (howlkin, filters) => {
      if (
        filters.search &&
        !howlkin.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.qualities.length > 0 &&
        !filters.qualities.includes(howlkin.quality)
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
        } else if (col === 'quality') {
          cmp =
            QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }
      // Default: quality > name
      const qA = QUALITY_ORDER.indexOf(a.quality);
      const qB = QUALITY_ORDER.indexOf(b.quality);
      if (qA !== qB) return qA - qB;
      return a.name.localeCompare(b.name);
    },
  });
  useSearchParamFilter(setFilters);

  const [allianceSearch, setAllianceSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return (
      window.localStorage.getItem(STORAGE_KEY.GOLDEN_ALLIANCE_SEARCH) || ''
    );
  });

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY.GOLDEN_ALLIANCE_SEARCH,
      allianceSearch
    );
  }, [allianceSearch]);

  const qualityOptions = useMemo(() => {
    return orderFilterOptions(
      howlkins.flatMap((howlkin) => (howlkin.quality ? [howlkin.quality] : [])),
      QUALITY_ORDER
    );
  }, [howlkins]);

  const filterGroups: ChipFilterGroup[] = useMemo(() => {
    if (qualityOptions.length === 0) return [];
    return [createQualityFilterGroup({ options: qualityOptions })];
  }, [qualityOptions]);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(howlkins),
    [howlkins]
  );

  const mostRecentAllianceUpdate = useMemo(
    () => getLatestTimestamp(goldenAlliances),
    [goldenAlliances]
  );

  const howlkinMap = useMemo(() => {
    const map = new Map<string, Howlkin>();
    for (const h of howlkins) {
      map.set(h.slug, h);
    }
    return map;
  }, [howlkins]);

  const howlkinToAlliance = useMemo(() => {
    const map = new Map<string, string>();
    for (const alliance of goldenAlliances) {
      for (const slug of alliance.howlkins) {
        map.set(slug, alliance.slug);
      }
    }
    return map;
  }, [goldenAlliances]);

  const filteredAlliances = useMemo(() => {
    if (!allianceSearch) return goldenAlliances;
    const q = allianceSearch.toLowerCase();
    return goldenAlliances.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.howlkins.some((h) => h.toLowerCase().includes(q))
    );
  }, [goldenAlliances, allianceSearch]);

  const {
    pageSize: alliancePageSize,
    setPageSize: setAlliancePageSize,
    pageSizeOptions: alliancePageSizeOptions,
  } = usePageSize([10, 20, 30, 50], {
    defaultSize: PAGE_SIZE,
    storageKey: getPageSizeStorageKey(STORAGE_KEY.GOLDEN_ALLIANCE_SEARCH),
  });

  const {
    page: alliancePage,
    setPage: setAlliancePage,
    totalPages: allianceTotalPages,
    offset: allianceOffset,
  } = usePagination(filteredAlliances.length, alliancePageSize, allianceSearch);

  useEffect(() => {
    setAlliancePage(1);
  }, [alliancePageSize, setAlliancePage]);

  const alliancePageItems = filteredAlliances.slice(
    allianceOffset,
    allianceOffset + alliancePageSize
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <SandstormOverlay active={shurimaActive} />
      <Stack gap="md">
        <ListPageHeader
          title="Howlkins"
          timestamp={
            activeTab === 'golden-alliances'
              ? mostRecentAllianceUpdate
              : mostRecentUpdate
          }
        >
          {activeTab === 'golden-alliances' ? (
            <Group gap="xs">
              <ExportButton data={goldenAlliances} filename="golden-alliances.json" />
              <SuggestModal
                buttonLabel="Suggest"
                modalTitle="Suggest a New Golden Alliance"
                issueTitle="[Golden Alliance] New golden alliance suggestion"
                fields={GOLDEN_ALLIANCE_FIELDS}
                arrayFields={GOLDEN_ALLIANCE_EFFECTS_FIELDS}
              />
            </Group>
          ) : (
            <Group gap="xs">
              <ExportButton data={howlkins} filename="howlkins.json" />
              <SuggestModal
                buttonLabel="Suggest"
                modalTitle="Suggest a New Howlkin"
                issueTitle="[Howlkin] New howlkin suggestion"
                fields={HOWLKIN_FIELDS}
                arrayFields={HOWLKIN_STATS_FIELDS}
              />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="howlkins">Howlkins</Tabs.Tab>
            <Tabs.Tab value="golden-alliances">Golden Alliances</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="howlkins" pt="md">
            {howlkinsLoading && (
              <ViewModeLoading viewMode={viewMode} cards={4} cardHeight={180} />
            )}

            {!howlkinsLoading && howlkinsError && (
              <DataFetchError
                title="Could not load howlkins"
                message={howlkinsError.message}
                onRetry={() => window.location.reload()}
              />
            )}

            {!howlkinsLoading && !howlkinsError && howlkins.length === 0 && (
              <EmptyState
                title="No howlkins yet"
                description="Howlkin data hasn't been added yet."
                color={accent.primary}
              />
            )}

            {!howlkinsLoading && !howlkinsError && howlkins.length > 0 && (
              <FilteredListShell
                count={filtered.length}
                noun="howlkin"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
                onResetFilters={resetFilters}
                emptyMessage="No howlkins match the current filters."
                page={howlkinPage}
                totalPages={howlkinTotalPages}
                onPageChange={setHowlkinPage}
                pageSize={howlkinPageSize}
                pageSizeOptions={howlkinPageSizeOptions}
                onPageSizeChange={setHowlkinPageSize}
                filterContent={
                  <EntityFilter
                    groups={filterGroups}
                    selected={{ qualities: filters.qualities }}
                    onChange={(key, values) =>
                      setFilters({
                        ...filters,
                        [key]: values as Quality[],
                      })
                    }
                    onClear={resetFilters}
                    search={filters.search}
                    onSearchChange={(value) =>
                      setFilters({ ...filters, search: value })
                    }
                    searchPlaceholder="Search by name..."
                  />
                }
                gridContent={
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {howlkinPageItems.map((howlkin) => {
                      const iconSrc = getHowlkinIcon(howlkin.slug, howlkin.quality);
                      const isPharaoh = howlkin.name === PHARAOH_NAME;
                      const allianceSlug = howlkinToAlliance.get(howlkin.slug);
                      return (
                        <Paper
                          key={howlkin.name}
                          {...(allianceSlug
                            ? { component: Link, to: `/howlkins/${allianceSlug}` }
                            : ({} as { component?: typeof Link; to: string }))}
                          p="md"
                          radius="md"
                          withBorder
                          {...getCardHoverProps({
                            interactive: !!allianceSlug,
                            style: allianceSlug ? LINK_BLOCK_RESET_STYLE : undefined,
                          })}
                          onMouseEnter={
                            isPharaoh
                              ? () => setShurimaActive(true)
                              : undefined
                          }
                          onMouseLeave={
                            isPharaoh
                              ? () => setShurimaActive(false)
                              : undefined
                          }
                          onTouchStart={
                            isPharaoh
                              ? () => setShurimaActive(true)
                              : undefined
                          }
                          onTouchEnd={
                            isPharaoh
                              ? () => setShurimaActive(false)
                              : undefined
                          }
                          onTouchCancel={
                            isPharaoh
                              ? () => setShurimaActive(false)
                              : undefined
                          }
                        >
                          <Stack gap="xs">
                            <Group gap="sm" wrap="nowrap">
                              {iconSrc && (
                                <SafeImage
                                  src={iconSrc}
                                  alt={howlkin.name}
                                  w={64}
                                  h={64}
                                  fit="contain"
                                  radius="sm"
                                />
                              )}
                              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Group gap="sm" wrap="wrap">
                                  <Text
                                    fw={700}
                                    className={allianceSlug ? 'dt-link-text' : undefined}
                                    lineClamp={1}
                                  >
                                    {howlkin.name}
                                  </Text>
                                  <QualityIcon quality={howlkin.quality} />
                                </Group>
                                <Stack gap={2}>
                                  {(howlkin.passive_effects ?? []).map(
                                    (e, i) => (
                                      <Text key={i} size="sm" c="dimmed">
                                        {e}
                                      </Text>
                                    )
                                  )}
                                </Stack>
                              </Stack>
                            </Group>
                            <HowlkinStats stats={howlkin.basic_stats} />
                          </Stack>
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
                            sortKey="quality"
                            sortCol={sortCol}
                            sortDir={sortDir}
                            onSort={handleSort}
                          >
                            Quality
                          </SortableTh>
                          <Table.Th>Basic Stats</Table.Th>
                          <Table.Th>Passive Effects</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {howlkinPageItems.map((howlkin) => {
                          const iconSrc = getHowlkinIcon(howlkin.slug, howlkin.quality);
                          const isPharaoh = howlkin.name === PHARAOH_NAME;
                          const allianceSlug = howlkinToAlliance.get(howlkin.slug);
                          return (
                            <Table.Tr
                              key={howlkin.name}
                              onMouseEnter={
                                isPharaoh
                                  ? () => setShurimaActive(true)
                                  : undefined
                              }
                              onMouseLeave={
                                isPharaoh
                                  ? () => setShurimaActive(false)
                                  : undefined
                              }
                              onTouchStart={
                                isPharaoh
                                  ? () => setShurimaActive(true)
                                  : undefined
                              }
                              onTouchEnd={
                                isPharaoh
                                  ? () => setShurimaActive(false)
                                  : undefined
                              }
                              onTouchCancel={
                                isPharaoh
                                  ? () => setShurimaActive(false)
                                  : undefined
                              }
                            >
                              <Table.Td>
                                {iconSrc && (
                                  <SafeImage
                                    src={iconSrc}
                                    alt={howlkin.name}
                                    w={40}
                                    h={40}
                                    fit="contain"
                                    radius="sm"
                                  />
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Text
                                  {...(allianceSlug
                                    ? { component: Link, to: `/howlkins/${allianceSlug}` }
                                    : ({} as { component?: typeof Link; to: string }))}
                                  fw={600}
                                  size="sm"
                                  className={allianceSlug ? 'dt-link-text' : undefined}
                                  style={allianceSlug ? { textDecoration: 'none' } : undefined}
                                >
                                  {howlkin.name}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <QualityIcon quality={howlkin.quality} />
                              </Table.Td>
                              <Table.Td>
                                <HowlkinStats stats={howlkin.basic_stats} />
                              </Table.Td>
                              <Table.Td>
                                <Stack gap={2}>
                                  {(howlkin.passive_effects ?? []).map(
                                    (e, i) => (
                                      <Text key={i} size="sm" c="dimmed">
                                        {e}
                                      </Text>
                                    )
                                  )}
                                </Stack>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                }
              />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="golden-alliances" pt="md">
            {alliancesLoading && <CardGridLoading cards={4} cardHeight={180} />}

            {!alliancesLoading && alliancesError && (
              <DataFetchError
                title="Could not load golden alliances"
                message={alliancesError.message}
                onRetry={() => window.location.reload()}
              />
            )}

            {!alliancesLoading &&
              !alliancesError &&
              goldenAlliances.length === 0 && (
                <EmptyState
                  title="No golden alliances yet"
                  description="Golden alliance data hasn't been added yet."
                  color={accent.primary}
                />
              )}

            {!alliancesLoading &&
              !alliancesError &&
              goldenAlliances.length > 0 && (
                <SearchableGridPanel
                  search={allianceSearch}
                  onSearchChange={setAllianceSearch}
                  searchPlaceholder="Search by name or member..."
                  hasResults={filteredAlliances.length > 0}
                  noResultsTitle="No alliances found"
                  noResultsMessage="No alliances match the search."
                  onResetSearch={() => setAllianceSearch('')}
                  currentPage={alliancePage}
                  totalPages={allianceTotalPages}
                  onPageChange={setAlliancePage}
                  totalItems={filteredAlliances.length}
                  pageSize={alliancePageSize}
                  pageSizeOptions={alliancePageSizeOptions}
                  onPageSizeChange={setAlliancePageSize}
                >
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {alliancePageItems.map((alliance) => (
                          <Paper
                            key={alliance.name}
                            component={Link}
                            to={`/howlkins/${alliance.slug}`}
                            p="md"
                            radius="md"
                            withBorder
                            {...getCardHoverProps({
                              interactive: true,
                              style: LINK_BLOCK_RESET_STYLE,
                            })}
                          >
                            <Stack gap="sm">
                              <Text fw={700} size="lg" className="dt-link-text">
                                {alliance.name}
                              </Text>

                              <div>
                                <Text size="xs" c="dimmed" fw={600} mb={4}>
                                  MEMBERS ({alliance.howlkins.length})
                                </Text>
                                <Group gap="xs" wrap="wrap">
                                  {[...alliance.howlkins]
                                    .sort((a, b) => {
                                      const qA = QUALITY_ORDER.indexOf(
                                        howlkinMap.get(a)?.quality ??
                                          ('' as Quality)
                                      );
                                      const qB = QUALITY_ORDER.indexOf(
                                        howlkinMap.get(b)?.quality ??
                                          ('' as Quality)
                                      );
                                      if (qA !== qB) return qA - qB;
                                      return a.localeCompare(b);
                                    })
                                    .map((howlkinSlug) => {
                                      const howlkin = howlkinMap.get(howlkinSlug);
                                      if (!howlkin) return null;
                                      return (
                                        <HowlkinBadge
                                          key={howlkinSlug}
                                          name={howlkin.name}
                                          howlkin={howlkin}
                                        />
                                      );
                                    })}
                                </Group>
                              </div>

                              <div>
                                <Text size="xs" c="dimmed" fw={600} mb={4}>
                                  ALLIANCE EFFECTS
                                </Text>
                                <Table withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th style={{ width: 70 }}>
                                        Level
                                      </Table.Th>
                                      <Table.Th>Stats</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {alliance.effects.map((effect) => (
                                      <Table.Tr key={effect.level}>
                                        <Table.Td>
                                          <Badge
                                            variant="light"
                                            size="sm"
                                            color={accent.secondary}
                                          >
                                            {effect.level}
                                          </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                          <Group gap={4} wrap="wrap">
                                            {effect.stats.map((stat, i) => (
                                              <Badge
                                                key={i}
                                                variant="outline"
                                                size="sm"
                                                color={accent.secondary}
                                              >
                                                {stat}
                                              </Badge>
                                            ))}
                                          </Group>
                                        </Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </div>
                            </Stack>
                          </Paper>
                        ))}
                  </SimpleGrid>
                </SearchableGridPanel>
              )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
