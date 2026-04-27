import {
  getOracleScrollImage,
  getRelicIcon,
} from '@/assets';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import FilteredListShell from '@/components/layout/FilteredListShell';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import SuggestModal, { type FieldDef } from '@/components/tools/SuggestModal';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import PaginationControl from '@/components/ui/PaginationControl';
import SortableTh from '@/components/ui/SortableTh';
import { RELIC_TYPE_ORDER, QUALITY_ORDER } from '@/constants/colors';
import {
  LINK_BLOCK_RESET_STYLE,
  getCardHoverProps,
  getMinWidthStyle,
} from '@/constants/styles';
import { PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import QualityIcon from '@/components/ui/QualityIcon';
import RelicTypeTag from '@/features/wiki/relics/components/RelicTypeTag';
import type { Relic, RelicType } from '@/features/wiki/relics/types';
import {
  applyDir,
  useDataFetch,
  useFilteredPageData,
  useGradientAccent,
  usePageSize,
  useTabParam,
} from '@/hooks';
import { getPageSizeStorageKey, usePagination } from '@/hooks/use-pagination';
import type { Quality } from '@/types/quality';
import { getLatestTimestamp } from '@/utils';
import { toEntitySlug } from '@/utils/entity-slug';
import {
  Badge,
  Container,
  Group,
  Image,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const RELIC_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Relic name',
  },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [...RELIC_TYPE_ORDER],
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: [...QUALITY_ORDER],
  },
  {
    name: 'oracle_sroll',
    label: 'Oracle Scroll',
    type: 'text',
    placeholder: 'Oracle scroll name (leave blank if none)',
  },
  {
    name: 'lore',
    label: 'Lore',
    type: 'textarea',
    required: true,
    placeholder: 'Relic lore text',
  },
];

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
  } = useDataFetch<Relic[]>('data/relic.json', []);

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
        (item.oracle_sroll ?? '').toLowerCase().includes(query) ||
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
        RELIC_TYPE_ORDER.indexOf(a.type) - RELIC_TYPE_ORDER.indexOf(b.type);
      const qualityCmp =
        QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
      const oracleCmp = (a.oracle_sroll ?? '').localeCompare(b.oracle_sroll ?? '');
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

  // Oracle Scrolls tab
  const oracleScrollNames = useMemo(() => {
    const names = new Set<string>();
    for (const relic of relics) {
      if (relic.oracle_sroll) names.add(relic.oracle_sroll);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [relics]);

  const relicsByOracle = useMemo(() => {
    const map = new Map<string, Relic[]>();
    for (const relic of relics) {
      if (!relic.oracle_sroll) continue;
      const list = map.get(relic.oracle_sroll) ?? [];
      list.push(relic);
      map.set(relic.oracle_sroll, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const typeCmp =
          RELIC_TYPE_ORDER.indexOf(a.type) - RELIC_TYPE_ORDER.indexOf(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [relics]);

  const [oracleSearch, setOracleSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return (
      window.localStorage.getItem(STORAGE_KEY.RELIC_ORACLE_SCROLL_SEARCH) || ''
    );
  });

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY.RELIC_ORACLE_SCROLL_SEARCH,
      oracleSearch
    );
  }, [oracleSearch]);

  const filteredOracleScrolls = useMemo(() => {
    const query = oracleSearch.trim().toLowerCase();
    return oracleScrollNames.filter((name) => {
      if (!query) return true;
      const relicsInScroll = relicsByOracle.get(name) ?? [];
      return (
        name.toLowerCase().includes(query) ||
        relicsInScroll.some((r) => r.name.toLowerCase().includes(query))
      );
    });
  }, [oracleScrollNames, oracleSearch, relicsByOracle]);

  const {
    pageSize: oraclePageSize,
    setPageSize: setOraclePageSize,
    pageSizeOptions: oraclePageSizeOptions,
  } = usePageSize([10, 20, 30, 50], {
    defaultSize: PAGE_SIZE,
    storageKey: getPageSizeStorageKey(STORAGE_KEY.RELIC_ORACLE_SCROLL_SEARCH),
  });

  const {
    page: oraclePage,
    setPage: setOraclePage,
    totalPages: oracleTotalPages,
    offset: oracleOffset,
  } = usePagination(filteredOracleScrolls.length, oraclePageSize, oracleSearch);

  useEffect(() => {
    setOraclePage(1);
  }, [oraclePageSize, setOraclePage]);

  const oraclePageItems = filteredOracleScrolls.slice(
    oracleOffset,
    oracleOffset + oraclePageSize
  );

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(relics), [relics]);

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Relics" timestamp={mostRecentUpdate}>
          <SuggestModal
            buttonLabel="Suggest Relic"
            modalTitle="Suggest New Relic"
            issueTitle="[Relic] New relic suggestion"
            fields={RELIC_FIELDS}
          />
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
                      const iconSrc = getRelicIcon(item.name);
                      const scrollSlug = item.oracle_sroll
                        ? toEntitySlug(item.oracle_sroll)
                        : null;
                      return (
                        <Paper
                          key={item.name}
                          {...(scrollSlug
                            ? { component: Link, to: `/oracle-scrolls/${scrollSlug}` }
                            : ({} as { component?: typeof Link; to: string }))}
                          p="md"
                          radius="md"
                          withBorder
                          {...getCardHoverProps({
                            interactive: !!scrollSlug,
                            style: scrollSlug ? LINK_BLOCK_RESET_STYLE : undefined,
                          })}
                        >
                          <Group gap="md" align="flex-start" wrap="nowrap">
                            {iconSrc && (
                              <Image
                                src={iconSrc}
                                alt={item.name}
                                w={64}
                                h={64}
                                fit="contain"
                                radius="sm"
                              />
                            )}
                            <Stack gap={4} style={{ flex: 1 }}>
                              <Group gap="sm" wrap="wrap">
                                <Text
                                  fw={700}
                                  c={scrollSlug ? `${accent.primary}.7` : undefined}
                                  lineClamp={1}
                                >
                                  {item.name}
                                </Text>
                                {item.quality && (
                                  <QualityIcon quality={item.quality} />
                                )}
                              </Group>
                              <Group gap="xs" wrap="wrap">
                                <RelicTypeTag type={item.type} />
                                {item.oracle_sroll && (
                                  <Badge
                                    variant="light"
                                    size="sm"
                                    color={accent.secondary}
                                  >
                                    {item.oracle_sroll}
                                  </Badge>
                                )}
                              </Group>
                              <Text size="xs" c="dimmed" lineClamp={2}>
                                {item.lore}
                              </Text>
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
                      style={getMinWidthStyle(680)}
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
                          const iconSrc = getRelicIcon(item.name);
                          return (
                          <Table.Tr key={item.name}>
                            <Table.Td>
                              {iconSrc && (
                                <Image
                                  src={iconSrc}
                                  alt={item.name}
                                  w={32}
                                  h={32}
                                  fit="contain"
                                />
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text
                                fw={600}
                                size="sm"
                                c={item.oracle_sroll ? `${accent.primary}.7` : undefined}
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
                              {item.oracle_sroll ? (
                                <Badge
                                  component={Link}
                                  to={`/oracle-scrolls/${toEntitySlug(item.oracle_sroll)}`}
                                  variant="light"
                                  size="sm"
                                  color={accent.secondary}
                                  style={{ cursor: 'pointer', textDecoration: 'none' }}
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  {item.oracle_sroll}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">
                                  —
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed" lineClamp={2}>
                                {item.lore}
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

          <Tabs.Panel value="oracle-scrolls" pt="md">
            <ListPageShell
              loading={loading}
              error={error}
              errorTitle="Could not load oracle scrolls"
              hasData={oracleScrollNames.length > 0}
              emptyMessage="No oracle scroll data available yet."
              skeletonCards={4}
            >
              <Paper p="md" radius="md" withBorder data-no-hover>
                <Stack gap="md">
                  <TextInput
                    placeholder="Search by oracle scroll or relic name..."
                    leftSection={<IoSearch size={14} />}
                    value={oracleSearch}
                    onChange={(e) => setOracleSearch(e.currentTarget.value)}
                  />

                  {filteredOracleScrolls.length === 0 ? (
                    <NoResultsSuggestions
                      title="No oracle scrolls found"
                      message="No oracle scrolls match the search."
                      onReset={() => setOracleSearch('')}
                      resetLabel="Clear search"
                    />
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      {oraclePageItems.map((scrollName) => {
                        const items = relicsByOracle.get(scrollName) ?? [];
                        const illustrationSrc = getOracleScrollImage(scrollName);
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
                              {illustrationSrc && (
                                <Image
                                  src={illustrationSrc}
                                  alt={scrollName}
                                  h={130}
                                  fit="cover"
                                  style={{
                                    display: 'block',
                                    objectPosition: 'top',
                                    borderTopLeftRadius: 'var(--mantine-radius-md)',
                                    borderTopRightRadius: 'var(--mantine-radius-md)',
                                  }}
                                />
                              )}
                              <Stack gap="xs" p="md">
                                <Group justify="space-between" align="center">
                                  <Text
                                    fw={700}
                                    c={`${accent.primary}.7`}
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
                                  {items.map((relic) => (
                                    <Group key={relic.name} gap="xs" wrap="nowrap">
                                      {getRelicIcon(relic.name) && (
                                        <Image
                                          src={getRelicIcon(relic.name)}
                                          alt={relic.name}
                                          w={24}
                                          h={24}
                                          fit="contain"
                                          radius="sm"
                                        />
                                      )}
                                      <Text size="sm" fw={500} style={{ flex: 1 }}>
                                        {relic.name}
                                      </Text>
                                      <RelicTypeTag type={relic.type} />
                                    </Group>
                                  ))}
                                </Stack>
                              </Stack>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </SimpleGrid>
                  )}

                  <PaginationControl
                    currentPage={oraclePage}
                    totalPages={oracleTotalPages}
                    onChange={setOraclePage}
                    totalItems={filteredOracleScrolls.length}
                    pageSize={oraclePageSize}
                    pageSizeOptions={oraclePageSizeOptions}
                    onPageSizeChange={setOraclePageSize}
                  />
                </Stack>
              </Paper>
            </ListPageShell>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
