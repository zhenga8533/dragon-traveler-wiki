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
  Title,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { getHowlkinIcon } from '../assets/howlkin';
import DataFetchError from '../components/common/DataFetchError';
import EmptyState from '../components/common/EmptyState';
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import EntityFilter from '../components/common/EntityFilter';
import HowlkinBadge from '../components/common/HowlkinBadge';
import HowlkinStats from '../components/common/HowlkinStats';
import LastUpdated from '../components/common/LastUpdated';
import NoResultsSuggestions from '../components/common/NoResultsSuggestions';
import PaginationControl from '../components/common/PaginationControl';
import QualityIcon from '../components/common/QualityIcon';
import { renderQualityFilterIcon } from '../components/common/renderQualityFilterIcon';
import SortableTh from '../components/common/SortableTh';
import FilterToolbar from '../components/layout/FilterToolbar';
import {
  CardGridLoading,
  ViewModeLoading,
} from '../components/layout/PageLoadingSkeleton';
import SuggestModal, {
  type ArrayFieldDef,
  type FieldDef,
} from '../components/tools/SuggestModal';
import { QUALITY_ORDER } from '../constants/colors';
import { PAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import {
  countActiveFilters,
  useFilterPanel,
  useFilters,
  useViewMode,
} from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { GoldenAlliance, Howlkin } from '../types/howlkin';
import type { Quality } from '../types/quality';
import { getLatestTimestamp } from '../utils';

const HOWLKIN_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Howlkin name',
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: QUALITY_ORDER,
  },
  {
    name: 'passive_effects',
    label: 'Passive Effects',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the passive effect(s), one per line',
  },
];

const HOWLKIN_STATS_FIELDS: ArrayFieldDef[] = [
  {
    name: 'basic_stats',
    label: 'Basic Stats',
    minItems: 1,
    fields: [
      {
        name: 'stat',
        label: 'Stat',
        type: 'text',
        required: true,
        placeholder: 'e.g. Belligerence',
      },
      {
        name: 'value',
        label: 'Value',
        type: 'text',
        required: true,
        placeholder: 'e.g. 108',
      },
    ],
  },
];

const GOLDEN_ALLIANCE_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Alliance Name',
    type: 'text',
    required: true,
    placeholder: 'Golden alliance name',
  },
  {
    name: 'howlkins',
    label: 'Members',
    type: 'textarea',
    required: true,
    placeholder: 'One Howlkin name per line',
  },
];

const GOLDEN_ALLIANCE_EFFECTS_FIELDS: ArrayFieldDef[] = [
  {
    name: 'effects',
    label: 'Alliance Effects',
    minItems: 1,
    fields: [
      {
        name: 'level',
        label: 'Level',
        type: 'number',
        required: true,
        placeholder: 'e.g. 1',
      },
      {
        name: 'stats',
        label: 'Stats',
        type: 'textarea',
        required: true,
        placeholder: 'List stats for this level (comma or newline separated)',
      },
    ],
  },
];

interface HowlkinFilters {
  search: string;
  qualities: Quality[];
}

const EMPTY_FILTERS: HowlkinFilters = {
  search: '',
  qualities: [],
};

export default function Howlkins() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'howlkins';
    return window.localStorage.getItem(STORAGE_KEY.HOWLKIN_TAB) || 'howlkins';
  });

  const handleTabChange = (value: string | null) => {
    const tab = value ?? 'howlkins';
    setActiveTab(tab);
    window.localStorage.setItem(STORAGE_KEY.HOWLKIN_TAB, tab);
  };

  const {
    data: howlkins,
    loading: howlkinsLoading,
    error: howlkinsError,
  } = useDataFetch<Howlkin[]>('data/howlkins.json', []);

  const {
    data: goldenAlliances,
    loading: alliancesLoading,
    error: alliancesError,
  } = useDataFetch<GoldenAlliance[]>('data/golden_alliances.json', []);

  const { filters, setFilters } = useFilters<HowlkinFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.HOWLKIN_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.HOWLKIN_VIEW_MODE,
    defaultMode: 'grid',
  });
  const { sortState, handleSort } = useSortState(STORAGE_KEY.HOWLKIN_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

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
    const qualities = new Set<Quality>();
    for (const howlkin of howlkins) {
      if (howlkin.quality) {
        qualities.add(howlkin.quality);
      }
    }
    return [...qualities].sort(
      (a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b)
    );
  }, [howlkins]);

  const filterGroups: ChipFilterGroup[] = useMemo(() => {
    if (qualityOptions.length === 0) return [];
    return [
      {
        key: 'qualities',
        label: 'Quality',
        options: qualityOptions,
        icon: renderQualityFilterIcon,
      },
    ];
  }, [qualityOptions]);

  const filtered = useMemo(() => {
    return howlkins
      .filter((howlkin) => {
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
      })
      .sort((a, b) => {
        if (sortCol) {
          let cmp = 0;
          if (sortCol === 'name') {
            cmp = a.name.localeCompare(b.name);
          } else if (sortCol === 'quality') {
            cmp =
              QUALITY_ORDER.indexOf(a.quality) -
              QUALITY_ORDER.indexOf(b.quality);
          }
          if (cmp !== 0) return applyDir(cmp, sortDir);
        }
        // Default: quality > name
        const qA = QUALITY_ORDER.indexOf(a.quality);
        const qB = QUALITY_ORDER.indexOf(b.quality);
        if (qA !== qB) return qA - qB;
        return a.name.localeCompare(b.name);
      });
  }, [howlkins, filters, sortCol, sortDir]);

  const {
    page: howlkinPage,
    setPage: setHowlkinPage,
    totalPages: howlkinTotalPages,
    offset: howlkinOffset,
  } = usePagination(filtered.length, PAGE_SIZE, JSON.stringify(filters));
  const howlkinPageItems = filtered.slice(
    howlkinOffset,
    howlkinOffset + PAGE_SIZE
  );

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
      map.set(h.name, h);
    }
    return map;
  }, [howlkins]);

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
    page: alliancePage,
    setPage: setAlliancePage,
    totalPages: allianceTotalPages,
    offset: allianceOffset,
  } = usePagination(filteredAlliances.length, PAGE_SIZE, allianceSearch);
  const alliancePageItems = filteredAlliances.slice(
    allianceOffset,
    allianceOffset + PAGE_SIZE
  );

  const activeFilterCount = countActiveFilters(filters);

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Howlkins</Title>
            <LastUpdated
              timestamp={
                activeTab === 'golden-alliances'
                  ? mostRecentAllianceUpdate
                  : mostRecentUpdate
              }
            />
          </Group>
          {activeTab === 'golden-alliances' ? (
            <SuggestModal
              buttonLabel="Suggest a Golden Alliance"
              modalTitle="Suggest a New Golden Alliance"
              issueTitle="[Golden Alliance] New golden alliance suggestion"
              fields={GOLDEN_ALLIANCE_FIELDS}
              arrayFields={GOLDEN_ALLIANCE_EFFECTS_FIELDS}
            />
          ) : (
            <SuggestModal
              buttonLabel="Suggest a Howlkin"
              modalTitle="Suggest a New Howlkin"
              issueTitle="[Howlkin] New howlkin suggestion"
              fields={HOWLKIN_FIELDS}
              arrayFields={HOWLKIN_STATS_FIELDS}
            />
          )}
        </Group>

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
              />
            )}

            {!howlkinsLoading && !howlkinsError && howlkins.length > 0 && (
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <FilterToolbar
                    count={filtered.length}
                    noun="howlkin"
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    filterCount={activeFilterCount}
                    filterOpen={filterOpen}
                    onFilterToggle={toggleFilter}
                  >
                    <EntityFilter
                      groups={filterGroups}
                      selected={{ qualities: filters.qualities }}
                      onChange={(key, values) =>
                        setFilters({
                          ...filters,
                          [key]: values as Quality[],
                        })
                      }
                      onClear={() => {
                        setFilters(EMPTY_FILTERS);
                        setAllianceSearch('');
                      }}
                      search={filters.search}
                      onSearchChange={(value) =>
                        setFilters({ ...filters, search: value })
                      }
                      searchPlaceholder="Search by name..."
                    />
                  </FilterToolbar>

                  {filtered.length === 0 ? (
                    <NoResultsSuggestions
                      title="No howlkins found"
                      message="No howlkins match the current filters."
                      onReset={() => setFilters(EMPTY_FILTERS)}
                      onOpenFilters={toggleFilter}
                    />
                  ) : viewMode === 'grid' ? (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                      {howlkinPageItems.map((howlkin) => {
                        const iconSrc = getHowlkinIcon(howlkin.name);
                        return (
                          <Paper
                            key={howlkin.name}
                            p="sm"
                            radius="md"
                            withBorder
                          >
                            <Stack gap="xs">
                              <Group gap="sm" wrap="nowrap">
                                {iconSrc && (
                                  <Image
                                    src={iconSrc}
                                    alt={howlkin.name}
                                    w={56}
                                    h={56}
                                    fit="contain"
                                    radius="sm"
                                  />
                                )}
                                <Stack gap={2} style={{ flex: 1 }}>
                                  <Group gap="sm" wrap="wrap">
                                    <QualityIcon quality={howlkin.quality} />
                                    <Text fw={600}>{howlkin.name}</Text>
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
                  ) : (
                    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                      <Table striped highlightOnHover style={{ minWidth: 720 }}>
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
                            const iconSrc = getHowlkinIcon(howlkin.name);
                            return (
                              <Table.Tr key={howlkin.name}>
                                <Table.Td>
                                  {iconSrc && (
                                    <Image
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
                                  <Text fw={600} size="sm">
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
                  )}

                  <PaginationControl
                    currentPage={howlkinPage}
                    totalPages={howlkinTotalPages}
                    onChange={setHowlkinPage}
                  />
                </Stack>
              </Paper>
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
                />
              )}

            {!alliancesLoading &&
              !alliancesError &&
              goldenAlliances.length > 0 && (
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="md">
                    <TextInput
                      placeholder="Search by name or member..."
                      leftSection={<IoSearch size={14} />}
                      value={allianceSearch}
                      onChange={(e) => setAllianceSearch(e.currentTarget.value)}
                    />
                    {filteredAlliances.length === 0 ? (
                      <NoResultsSuggestions
                        title="No alliances found"
                        message="No alliances match the search."
                        onReset={() => setAllianceSearch('')}
                        resetLabel="Clear search"
                      />
                    ) : (
                      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                        {alliancePageItems.map((alliance) => (
                          <Paper
                            key={alliance.name}
                            p="md"
                            radius="md"
                            withBorder
                          >
                            <Stack gap="sm">
                              <Text fw={700} size="lg">
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
                                    .map((name) => (
                                      <HowlkinBadge
                                        key={name}
                                        name={name}
                                        howlkin={howlkinMap.get(name)}
                                      />
                                    ))}
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
                                          <Badge variant="light" size="sm">
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
                                                color="teal"
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
                    )}

                    <PaginationControl
                      currentPage={alliancePage}
                      totalPages={allianceTotalPages}
                      onChange={setAlliancePage}
                    />
                  </Stack>
                </Paper>
              )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
