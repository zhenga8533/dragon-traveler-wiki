import ExpandableText from '@/components/ui/ExpandableText';
import SafeImage from '@/components/ui/SafeImage';
import {
  getOracleScrollVideo,
  getRelicIcon,
} from '@/assets';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import EntitySummaryCard from '@/components/common/EntitySummaryCard';
import FilteredListShell from '@/components/layout/FilteredListShell';
import SearchableGridPanel from '@/components/layout/SearchableGridPanel';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal from '@/components/tools/SuggestModal';
import RichText from '@/components/common/RichText';
import { RELIC_FIELDS } from '@/features/wiki/relics/form-fields';
import SortableTh from '@/components/ui/SortableTh';
import { QUALITY_ORDER } from '@/constants/quality';
import { RELIC_TYPE_ORDER } from '@/constants/relic-colors';
import {
  LINK_BLOCK_RESET_STYLE,
  getCardHoverProps,
  getMinWidthStyle,
} from '@/constants/styles';
import { IMAGE_SIZE, PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import QualityIcon from '@/components/ui/QualityIcon';
import RelicTypeTag from '@/features/wiki/relics/components/RelicTypeTag';
import type { Relic, RelicType } from '@/features/wiki/relics/types';
import {
  getRelicOracleScroll,
  getRelicTypeOrder,
} from '@/features/wiki/relics/utils';
import { useRelics, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilteredPageData,
  useGradientAccent,
  useSearchParamFilter,
  useSecondaryTabList,
  useTabParam,
} from '@/hooks';
import type { Quality } from '@/types/quality';
import { getLatestTimestamp } from '@/utils';
import { toEntitySlug } from '@/utils/entity-slug';
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
import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface RelicFilters {
  search: string;
  types: RelicType[];
  qualities: Quality[];
}

const EMPTY_FILTERS: RelicFilters = {
  search: '',
  types: [],
  qualities: [],
};

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'types',
    label: 'Type',
    options: [...RELIC_TYPE_ORDER],
  },
  {
    ...createQualityFilterGroup(),
  },
];

export default function RelicPage() {
  const { accent } = useGradientAccent();
  const [activeTab, handleTabChange] = useTabParam('tab', 'relics', [
    'relics',
    'oracle-scrolls',
  ]);

  const {
    data: relics,
    loading,
    error,
  } = useRelics();
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
    pageItems: relicPageItems,
    filtered,
    page: relicPage,
    setPage: setRelicPage,
    totalPages: relicTotalPages,
    pageSize: relicPageSize,
    setPageSize: setRelicPageSize,
    pageSizeOptions: relicPageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(relics, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.RELIC_FILTERS,
      viewMode: STORAGE_KEY.RELIC_VIEW_MODE,
      sort: STORAGE_KEY.RELIC_SORT,
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
        (getRelicOracleScroll(item) ?? '').toLowerCase().includes(query) ||
        item.lore.toLowerCase().includes(query);
      const matchesType =
        filters.types.length === 0 || filters.types.includes(item.type);
      const matchesQuality =
        filters.qualities.length === 0 ||
        filters.qualities.includes(item.quality);
      return matchesSearch && matchesType && matchesQuality;
    },
    sortFn: (a, b, col, dir) => {
      const typeCmp =
        getRelicTypeOrder(a.type, RELIC_TYPE_ORDER) -
        getRelicTypeOrder(b.type, RELIC_TYPE_ORDER);
      const qualityCmp =
        QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
      const oracleCmp = (getRelicOracleScroll(a) ?? '').localeCompare(
        getRelicOracleScroll(b) ?? ''
      );
      const nameCmp = a.name.localeCompare(b.name);

      if (col) {
        let cmp = 0;
        if (col === 'name') {
          cmp = nameCmp;
        } else if (col === 'type') {
          cmp = typeCmp || qualityCmp || oracleCmp || nameCmp;
        } else if (col === 'rarity') {
          cmp = qualityCmp || oracleCmp || typeCmp || nameCmp;
        } else if (col === 'oracle') {
          cmp = oracleCmp || typeCmp || nameCmp;
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }

      if (qualityCmp !== 0) return qualityCmp;
      if (oracleCmp !== 0) return oracleCmp;
      if (typeCmp !== 0) return typeCmp;
      return nameCmp;
    },
  });
  useSearchParamFilter(setFilters);

  // Oracle Scrolls tab
  const oracleScrollNames = useMemo(() => {
    const names = new Set<string>();
    for (const relic of relics) {
      const oracleScroll = getRelicOracleScroll(relic);
      if (oracleScroll) names.add(oracleScroll);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [relics]);

  const relicsByOracle = useMemo(() => {
    const map = new Map<string, Relic[]>();
    for (const relic of relics) {
      const oracleScroll = getRelicOracleScroll(relic);
      if (!oracleScroll) continue;
      const list = map.get(oracleScroll) ?? [];
      list.push(relic);
      map.set(oracleScroll, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const typeCmp =
          getRelicTypeOrder(a.type, RELIC_TYPE_ORDER) -
          getRelicTypeOrder(b.type, RELIC_TYPE_ORDER);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [relics]);

  const oracleSearchFn = useCallback(
    (name: string, query: string) => {
      const relicsInScroll = relicsByOracle.get(name) ?? [];
      return (
        name.toLowerCase().includes(query) ||
        relicsInScroll.some((r) => r.name.toLowerCase().includes(query))
      );
    },
    [relicsByOracle]
  );

  const {
    search: oracleSearch,
    setSearch: setOracleSearch,
    filtered: filteredOracleScrolls,
    pageItems: oraclePageItems,
    page: oraclePage,
    setPage: setOraclePage,
    totalPages: oracleTotalPages,
    pageSize: oraclePageSize,
    setPageSize: setOraclePageSize,
    pageSizeOptions: oraclePageSizeOptions,
  } = useSecondaryTabList(oracleScrollNames, {
    searchFn: oracleSearchFn,
    storageKeys: { search: STORAGE_KEY.RELIC_ORACLE_SCROLL_SEARCH },
    pageSize: PAGE_SIZE,
  });

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(relics), [relics]);

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Relics" timestamp={mostRecentUpdate}>
          <Group gap="xs">
            <ExportButton data={relics} filename="relic.json" />
            <SuggestModal
              buttonLabel="Suggest"
              modalTitle="Suggest New Relic"
              issueTitle="[Relic] New relic suggestion"
              fields={RELIC_FIELDS}
            />
          </Group>
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="relics">Relics</Tabs.Tab>
            <Tabs.Tab value="oracle-scrolls">Oracle Scrolls</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="relics" pt="md">
            <ListPageShell
              loading={loading}
              error={error}
              errorTitle="Could not load relics"
              hasData={relics.length > 0}
              emptyMessage="No relic data available yet."
              skeletonCards={4}
            >
              <FilteredListShell
                count={filtered.length}
                noun="relic"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
                onResetFilters={resetFilters}
                emptyMessage="No relics match the current filters."
                page={relicPage}
                totalPages={relicTotalPages}
                onPageChange={setRelicPage}
                pageSize={relicPageSize}
                pageSizeOptions={relicPageSizeOptions}
                onPageSizeChange={setRelicPageSize}
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
                          types: values as RelicType[],
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
                    searchPlaceholder="Search by name, oracle scroll, or lore..."
                  />
                }
                gridContent={
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {relicPageItems.map((item) => {
                      const iconSrc = getRelicIcon(item.slug, item.quality);
                      const oracleScroll = getRelicOracleScroll(item);
                      const scrollSlug = oracleScroll
                        ? toEntitySlug(oracleScroll)
                        : null;
                      return (
                        <EntitySummaryCard
                          key={item.name}
                          to={scrollSlug ? `/oracle-scrolls/${scrollSlug}` : null}
                          title={item.name}
                          imageSrc={iconSrc}
                          titleAccessory={
                            item.quality && (
                              <QualityIcon quality={item.quality} />
                            )
                          }
                          metadata={
                            <Group gap="xs" wrap="wrap">
                              <RelicTypeTag type={item.type} />
                              {oracleScroll && (
                                <Badge
                                  variant="light"
                                  size="sm"
                                  color={accent.secondary}
                                >
                                  {oracleScroll}
                                </Badge>
                              )}
                            </Group>
                          }
                          description={
                            <ExpandableText size="xs">
                              <RichText text={item.lore} statusEffects={statusEffects} italic />
                            </ExpandableText>
                          }
                        />
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
                            sortKey="rarity"
                            sortCol={sortCol}
                            sortDir={sortDir}
                            onSort={handleSort}
                          >
                            Rarity
                          </SortableTh>
                          <SortableTh
                            sortKey="oracle"
                            sortCol={sortCol}
                            sortDir={sortDir}
                            onSort={handleSort}
                          >
                            Oracle Scroll
                          </SortableTh>
                          <Table.Th>Lore</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {relicPageItems.map((item) => {
                          const iconSrc = getRelicIcon(item.slug, item.quality);
                          const oracleScroll = getRelicOracleScroll(item);
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
                            <Table.Td>
                              <Text
                                fw={600}
                                size="sm"
                                className={oracleScroll ? 'dt-link-text' : undefined}
                              >
                                {item.name}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <RelicTypeTag type={item.type} />
                            </Table.Td>
                            <Table.Td>
                              {item.quality && (
                                <QualityIcon quality={item.quality} />
                              )}
                            </Table.Td>
                            <Table.Td>
                              {oracleScroll ? (
                                <Badge
                                  component={Link}
                                  to={`/oracle-scrolls/${toEntitySlug(oracleScroll)}`}
                                  variant="light"
                                  size="sm"
                                  color={accent.secondary}
                                  style={{ cursor: 'pointer', textDecoration: 'none' }}
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  {oracleScroll}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">
                                  —
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <ExpandableText size="sm">
                                <RichText text={item.lore} statusEffects={statusEffects} italic />
                              </ExpandableText>
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

          <Tabs.Panel value="oracle-scrolls" pt="md">
            <ListPageShell
              loading={loading}
              error={error}
              errorTitle="Could not load oracle scrolls"
              hasData={oracleScrollNames.length > 0}
              emptyMessage="No oracle scroll data available yet."
              skeletonCards={4}
            >
              <SearchableGridPanel
                search={oracleSearch}
                onSearchChange={setOracleSearch}
                searchPlaceholder="Search by oracle scroll or relic name..."
                hasResults={filteredOracleScrolls.length > 0}
                noResultsTitle="No oracle scrolls found"
                noResultsMessage="No oracle scrolls match the search."
                onResetSearch={() => setOracleSearch('')}
                currentPage={oraclePage}
                totalPages={oracleTotalPages}
                onPageChange={setOraclePage}
                totalItems={filteredOracleScrolls.length}
                pageSize={oraclePageSize}
                pageSizeOptions={oraclePageSizeOptions}
                onPageSizeChange={setOraclePageSize}
              >
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {oraclePageItems.map((scrollName) => {
                        const items = relicsByOracle.get(scrollName) ?? [];
                        const videoSrc = getOracleScrollVideo(scrollName);
                        return (
                          <Paper
                            key={scrollName}
                            component={Link}
                            to={`/oracle-scrolls/${toEntitySlug(scrollName)}`}
                            p={0}
                            radius="md"
                            withBorder
                            style={{ overflow: 'hidden' }}
                            {...getCardHoverProps({
                              interactive: true,
                              style: LINK_BLOCK_RESET_STYLE,
                            })}
                          >
                            <Stack gap={0}>
                              {videoSrc && (
                                <video
                                  src={videoSrc}
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    height: 130,
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    borderTopLeftRadius: 'var(--mantine-radius-md)',
                                    borderTopRightRadius: 'var(--mantine-radius-md)',
                                  }}
                                />
                              )}
                              <Stack gap="xs" p="md">
                                <Group justify="space-between" align="center">
                                  <Text
                                    fw={700}
                                    className="dt-link-text"
                                    lineClamp={1}
                                    style={{ flex: 1 }}
                                  >
                                    {scrollName}
                                  </Text>
                                  <Badge
                                    variant="light"
                                    size="sm"
                                    color={accent.secondary}
                                    style={{ flexShrink: 0 }}
                                  >
                                    {items.length} relic
                                    {items.length === 1 ? '' : 's'}
                                  </Badge>
                                </Group>

                                <Stack gap={4}>
                                  {items.map((relic) => {
                                    const relicIconSrc = getRelicIcon(
                                      relic.slug,
                                      relic.quality
                                    );
                                    return (
                                      <Group
                                        key={relic.name}
                                        gap="xs"
                                        wrap="nowrap"
                                      >
                                        {relicIconSrc && (
                                          <SafeImage
                                            src={relicIconSrc}
                                            alt={relic.name}
                                            w={24}
                                            h={24}
                                            fit="contain"
                                            radius="sm"
                                          />
                                        )}
                                        <Text
                                          size="sm"
                                          fw={500}
                                          style={{ flex: 1 }}
                                        >
                                          {relic.name}
                                        </Text>
                                        <RelicTypeTag type={relic.type} />
                                      </Group>
                                    );
                                  })}
                                </Stack>
                              </Stack>
                            </Stack>
                          </Paper>
                        );
                      })}
                </SimpleGrid>
              </SearchableGridPanel>
            </ListPageShell>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
