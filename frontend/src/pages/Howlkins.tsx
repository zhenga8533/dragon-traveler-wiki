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
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMemo } from 'react';
import { getHowlkinIcon } from '../assets/howlkin';
import { QUALITY_ICON_MAP } from '../assets/quality';
import DataFetchError from '../components/DataFetchError';
import type { ChipFilterGroup } from '../components/EntityFilter';
import EntityFilter from '../components/EntityFilter';
import FilterToolbar from '../components/FilterToolbar';
import LastUpdated from '../components/LastUpdated';
import { ListPageLoading } from '../components/PageLoadingSkeleton';
import SortableTh from '../components/SortableTh';
import SuggestModal, {
  type ArrayFieldDef,
  type FieldDef,
} from '../components/SuggestModal';
import { QUALITY_ORDER } from '../constants/colors';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { Quality } from '../types/character';
import type { Howlkin } from '../types/howlkin';

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
    options: ['UR', 'SSR EX', 'SSR+', 'SSR', 'SR', 'R', 'N'],
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

interface HowlkinFilters {
  search: string;
  qualities: Quality[];
}

const EMPTY_FILTERS: HowlkinFilters = {
  search: '',
  qualities: [],
};

export default function Howlkins() {
  const {
    data: howlkins,
    loading,
    error,
  } = useDataFetch<Howlkin[]>('data/howlkins.json', []);
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
    return [{ key: 'qualities', label: 'Quality', options: qualityOptions }];
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

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const h of howlkins) {
      if (h.last_updated > latest) latest = h.last_updated;
    }
    return latest;
  }, [howlkins]);

  const activeFilterCount = (filters.search ? 1 : 0) + filters.qualities.length;

  const renderStats = (stats: Howlkin['basic_stats']) => {
    const entries = Object.entries(stats ?? {}).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    if (entries.length === 0) {
      return (
        <Text size="xs" c="dimmed">
          No stats listed.
        </Text>
      );
    }
    return (
      <Group gap={6} wrap="wrap">
        {entries.map(([stat, value]) => (
          <Badge key={stat} variant="light" size="sm" color="blue">
            {stat}:{' '}
            {typeof value === 'number'
              ? value.toLocaleString(undefined, {
                  maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
                })
              : String(value)}
          </Badge>
        ))}
      </Group>
    );
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Howlkins</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Howlkin"
            modalTitle="Suggest a New Howlkin"
            issueTitle="[Howlkin] New howlkin suggestion"
            fields={HOWLKIN_FIELDS}
            arrayFields={HOWLKIN_STATS_FIELDS}
          />
        </Group>

        {loading && <ListPageLoading cards={4} />}

        {!loading && error && (
          <DataFetchError
            title="Could not load howlkins"
            message={error.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && howlkins.length === 0 && (
          <Text c="dimmed">No howlkin data available yet.</Text>
        )}

        {!loading && !error && howlkins.length > 0 && (
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
                  onClear={() => setFilters(EMPTY_FILTERS)}
                  search={filters.search}
                  onSearchChange={(value) =>
                    setFilters({ ...filters, search: value })
                  }
                  searchPlaceholder="Search by name..."
                />
              </FilterToolbar>

              {filtered.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">
                  No howlkins match the current filters.
                </Text>
              ) : viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  {filtered.map((howlkin) => {
                    const iconSrc = getHowlkinIcon(howlkin.name);
                    return (
                      <Paper key={howlkin.name} p="sm" radius="md" withBorder>
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
                                <Tooltip label={howlkin.quality}>
                                  <Image
                                    src={QUALITY_ICON_MAP[howlkin.quality]}
                                    alt={howlkin.quality}
                                    h={20}
                                    w="auto"
                                    fit="contain"
                                  />
                                </Tooltip>
                                <Text fw={600}>{howlkin.name}</Text>
                              </Group>
                              <Stack gap={2}>
                                {(howlkin.passive_effects ?? []).map((e, i) => (
                                  <Text key={i} size="sm" c="dimmed">
                                    {e}
                                  </Text>
                                ))}
                              </Stack>
                            </Stack>
                          </Group>
                          {renderStats(howlkin.basic_stats)}
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
                      {filtered.map((howlkin) => {
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
                              <Tooltip label={howlkin.quality}>
                                <Image
                                  src={QUALITY_ICON_MAP[howlkin.quality]}
                                  alt={howlkin.quality}
                                  h={20}
                                  w="auto"
                                  fit="contain"
                                />
                              </Tooltip>
                            </Table.Td>
                            <Table.Td>
                              {renderStats(howlkin.basic_stats)}
                            </Table.Td>
                            <Table.Td>
                              <Stack gap={2}>
                                {(howlkin.passive_effects ?? []).map((e, i) => (
                                  <Text key={i} size="sm" c="dimmed">
                                    {e}
                                  </Text>
                                ))}
                              </Stack>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
