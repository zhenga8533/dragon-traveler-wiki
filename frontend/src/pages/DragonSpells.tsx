import {
  Badge,
  Center,
  Container,
  Group,
  Image,
  Loader,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useMemo } from 'react';
import { getWyrmspellIcon } from '../assets/wyrmspell';
import DataFetchError from '../components/DataFetchError';
import EntityFilter from '../components/EntityFilter';
import type { ChipFilterGroup } from '../components/EntityFilter';
import FilterToolbar from '../components/FilterToolbar';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import type { Wyrmspell } from '../types/wyrmspell';

const WYRMSPELL_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Wyrmspell name',
  },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: ['Breach', 'Refuge', 'Wildcry', "Dragon's Call"],
  },
  {
    name: 'effect',
    label: 'Effect',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the effect',
  },
];

interface WyrmspellFilters {
  search: string;
  types: string[];
}

const EMPTY_FILTERS: WyrmspellFilters = {
  search: '',
  types: [],
};

export default function DragonSpells() {
  const {
    data: wyrmspells,
    loading,
    error,
  } = useDataFetch<Wyrmspell[]>('data/wyrmspells.json', []);
  const { filters, setFilters } = useFilters<WyrmspellFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.WYRMSPELL_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.WYRMSPELL_VIEW_MODE,
    defaultMode: 'list',
  });

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const spell of wyrmspells) {
      if (spell.type) {
        types.add(spell.type);
      }
    }
    return [...types].sort();
  }, [wyrmspells]);

  const filterGroups: ChipFilterGroup[] = useMemo(
    () =>
      typeOptions.length > 0
        ? [{ key: 'types', label: 'Type', options: typeOptions }]
        : [],
    [typeOptions]
  );

  const filtered = useMemo(() => {
    return wyrmspells
      .filter((spell) => {
        if (
          filters.search &&
          !spell.name.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false;
        }
        if (filters.types.length > 0 && !filters.types.includes(spell.type)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [wyrmspells, filters]);

  const activeFilterCount = (filters.search ? 1 : 0) + filters.types.length;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Wyrmspells</Title>
          <SuggestModal
            buttonLabel="Suggest a Wyrmspell"
            modalTitle="Suggest a New Wyrmspell"
            issueTitle="[Wyrmspell] New wyrmspell suggestion"
            fields={WYRMSPELL_FIELDS}
          />
        </Group>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && error && (
          <DataFetchError
            title="Could not load wyrmspells"
            message={error.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && wyrmspells.length === 0 && (
          <Text c="dimmed">No wyrmspell data available yet.</Text>
        )}

        {!loading && !error && wyrmspells.length > 0 && (
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <FilterToolbar
                count={filtered.length}
                noun="wyrmspell"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
              >
                <EntityFilter
                  groups={filterGroups}
                  selected={{ types: filters.types }}
                  onChange={(key, values) =>
                    setFilters({ ...filters, [key]: values })
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
                  No wyrmspells match the current filters.
                </Text>
              ) : viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  {filtered.map((spell) => {
                    const iconSrc = getWyrmspellIcon(spell.name);
                    return (
                      <Paper key={spell.name} p="sm" radius="md" withBorder>
                        <Group gap="md" align="flex-start" wrap="nowrap">
                          {iconSrc && (
                            <Image
                              src={iconSrc}
                              alt={spell.name}
                              w={56}
                              h={56}
                              fit="contain"
                            />
                          )}
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Group gap="sm" wrap="wrap">
                              <Text fw={600}>{spell.name}</Text>
                              <Badge variant="light" size="sm">
                                {spell.type}
                              </Badge>
                            </Group>
                            <Text size="sm">{spell.effect}</Text>
                          </Stack>
                        </Group>
                      </Paper>
                    );
                  })}
                </SimpleGrid>
              ) : (
                <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                  <Table striped highlightOnHover style={{ minWidth: 640 }}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Icon</Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Effect</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filtered.map((spell) => {
                        const iconSrc = getWyrmspellIcon(spell.name);
                        return (
                          <Table.Tr key={spell.name}>
                            <Table.Td>
                              {iconSrc && (
                                <Image
                                  src={iconSrc}
                                  alt={spell.name}
                                  w={40}
                                  h={40}
                                  fit="contain"
                                />
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text fw={600} size="sm">
                                {spell.name}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" size="sm">
                                {spell.type}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{spell.effect}</Text>
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
