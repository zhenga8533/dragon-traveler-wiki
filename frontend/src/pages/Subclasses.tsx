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
} from '@mantine/core';
import { useMemo } from 'react';
import { CLASS_ICON_MAP } from '../assets/class';
import { getSubclassIcon } from '../assets/subclass';
import type { ChipFilterGroup } from '../components/EntityFilter';
import EntityFilter from '../components/EntityFilter';
import FilterToolbar from '../components/FilterToolbar';
import LastUpdated from '../components/LastUpdated';
import ListPageShell from '../components/ListPageShell';
import RichText from '../components/RichText';
import SortableTh from '../components/SortableTh';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { CLASS_ORDER } from '../constants/colors';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { CharacterClass } from '../types/character';
import type { StatusEffect } from '../types/status-effect';
import type { Subclass } from '../types/subclass';
import { getLatestTimestamp } from '../utils';

const SUBCLASS_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Subclass name',
  },
  {
    name: 'class',
    label: 'Class',
    type: 'select',
    required: true,
    options: CLASS_ORDER,
  },
  {
    name: 'tier',
    label: 'Tier',
    type: 'number',
    required: true,
    placeholder: '1, 2, or 3',
  },
  {
    name: 'bonuses',
    label: 'Bonuses',
    type: 'textarea',
    required: true,
    placeholder: 'One bonus per line',
  },
  {
    name: 'effect',
    label: 'Effect',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the subclass effect',
  },
];

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
  {
    key: 'classes',
    label: 'Class',
    options: [...CLASS_ORDER],
  },
  {
    key: 'tiers',
    label: 'Tier',
    options: ['1', '2', '3'],
  },
];

export default function Subclasses() {
  const {
    data: subclasses,
    loading,
    error,
  } = useDataFetch<Subclass[]>('data/subclasses.json', []);
  const { data: statusEffects } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );

  const { filters, setFilters } = useFilters<SubclassFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.SUBCLASS_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.SUBCLASS_VIEW_MODE,
    defaultMode: 'list',
  });
  const { sortState, handleSort } = useSortState(STORAGE_KEY.SUBCLASS_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

  const filtered = useMemo(() => {
    return subclasses
      .filter((item) => {
        if (
          filters.search &&
          !item.name.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false;
        }

        if (
          filters.classes.length > 0 &&
          !filters.classes.includes(item.class)
        ) {
          return false;
        }

        if (
          filters.tiers.length > 0 &&
          !filters.tiers.includes(String(item.tier))
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
          } else if (sortCol === 'class') {
            cmp = a.class.localeCompare(b.class, undefined, {
              sensitivity: 'base',
            });
          } else if (sortCol === 'tier') {
            cmp = a.tier - b.tier;
          }

          if (cmp !== 0) return applyDir(cmp, sortDir);
        }

        const classCmp = a.class.localeCompare(b.class, undefined, {
          sensitivity: 'base',
        });
        if (classCmp !== 0) return classCmp;
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
      });
  }, [subclasses, filters, sortCol, sortDir]);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(subclasses),
    [subclasses]
  );

  const activeFilterCount =
    (filters.search ? 1 : 0) + filters.classes.length + filters.tiers.length;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Subclasses</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Subclass"
            modalTitle="Suggest a New Subclass"
            issueTitle="[Subclass] New subclass suggestion"
            fields={SUBCLASS_FIELDS}
          />
        </Group>

        <ListPageShell
          loading={loading}
          error={error}
          errorTitle="Could not load subclasses"
          hasData={subclasses.length > 0}
          emptyMessage="No subclass data available yet."
          skeletonCards={4}
        >
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <FilterToolbar
                count={filtered.length}
                noun="subclass"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
              >
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
                  No subclasses match the current filters.
                </Text>
              ) : viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  {filtered.map((item) => {
                    const classIcon = CLASS_ICON_MAP[item.class];
                    const subclassIcon = getSubclassIcon(item.name, item.class);
                    return (
                      <Paper key={item.name} p="sm" radius="md" withBorder>
                        <Stack gap="xs">
                          <Group gap="sm" wrap="nowrap">
                            {subclassIcon && (
                              <Image
                                src={subclassIcon}
                                alt={item.name}
                                w={52}
                                h={48}
                                fit="contain"
                              />
                            )}
                            <Stack gap={2} style={{ flex: 1 }}>
                              <Text fw={600}>{item.name}</Text>
                              <Group gap="xs">
                                <Image
                                  src={classIcon}
                                  alt={item.class}
                                  w={16}
                                  h={16}
                                />
                                <Text size="xs" c="dimmed">
                                  {item.class}
                                </Text>
                                <Badge variant="light" size="xs" color="grape">
                                  Tier {item.tier}
                                </Badge>
                              </Group>
                            </Stack>
                          </Group>

                          {item.bonuses.length > 0 && (
                            <Group gap="xs" wrap="wrap">
                              {item.bonuses.map((bonus) => (
                                <Badge key={bonus} variant="outline" size="xs">
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
              ) : (
                <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                  <Table striped highlightOnHover style={{ minWidth: 860 }}>
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
                      {filtered.map((item) => {
                        const classIcon = CLASS_ICON_MAP[item.class];
                        const subclassIcon = getSubclassIcon(
                          item.name,
                          item.class
                        );
                        return (
                          <Table.Tr key={item.name}>
                            <Table.Td>
                              {subclassIcon && (
                                <Image
                                  src={subclassIcon}
                                  alt={item.name}
                                  w={48}
                                  h={44}
                                  fit="contain"
                                />
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text fw={600} size="sm">
                                {item.name}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={6} wrap="nowrap">
                                <Image
                                  src={classIcon}
                                  alt={item.class}
                                  w={16}
                                  h={16}
                                />
                                <Text size="sm">{item.class}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" color="grape" size="sm">
                                Tier {item.tier}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" wrap="wrap">
                                {item.bonuses.map((bonus) => (
                                  <Badge
                                    key={bonus}
                                    variant="outline"
                                    size="xs"
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
              )}
            </Stack>
          </Paper>
        </ListPageShell>
      </Stack>
    </Container>
  );
}
