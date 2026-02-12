import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Chip,
  Collapse,
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
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { IoFilter, IoGrid, IoList, IoSearch } from 'react-icons/io5';
import { getWyrmspellIcon } from '../assets/wyrmspell';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilters } from '../hooks/use-filters';
import type { Wyrmspell } from '../types/wyrmspell';

const WYRMSPELL_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Wyrmspell name' },
  { name: 'type', label: 'Type', type: 'select', required: true, options: ['Breach', 'Refuge', 'Wildcry', "Dragon's Call"] },
  { name: 'effect', label: 'Effect', type: 'textarea', required: true, placeholder: 'Describe the effect' },
];

interface WyrmspellFilters {
  search: string;
  types: string[];
}

const EMPTY_FILTERS: WyrmspellFilters = {
  search: '',
  types: [],
};

type ViewMode = 'list' | 'grid';

export default function DragonSpells() {
  const { data: wyrmspells, loading } = useDataFetch<Wyrmspell[]>(
    'data/wyrmspells.json',
    []
  );
  const { filters, setFilters } = useFilters<WyrmspellFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.WYRMSPELL_FILTERS,
  });
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') {
      return 'list';
    }
    const stored = window.localStorage.getItem(STORAGE_KEY.WYRMSPELL_VIEW_MODE);
    return stored === 'grid' || stored === 'list' ? stored : 'list';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.WYRMSPELL_VIEW_MODE, viewMode);
  }, [viewMode]);

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const spell of wyrmspells) {
      if (spell.type) {
        types.add(spell.type);
      }
    }
    return [...types].sort();
  }, [wyrmspells]);

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

        {!loading && wyrmspells.length === 0 && (
          <Text c="dimmed">No wyrmspell data available yet.</Text>
        )}

        {!loading && wyrmspells.length > 0 && (
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap">
                <Text size="sm" c="dimmed">
                  {filtered.length} wyrmspell{filtered.length !== 1 ? 's' : ''}
                </Text>
                <Group gap="xs">
                  <Group gap={4}>
                    <Tooltip label="Grid view">
                      <ActionIcon
                        variant={viewMode === 'grid' ? 'filled' : 'default'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <IoGrid size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="List view">
                      <ActionIcon
                        variant={viewMode === 'list' ? 'filled' : 'default'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <IoList size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                  <Button
                    variant="default"
                    size="xs"
                    leftSection={<IoFilter size={16} />}
                    rightSection={
                      activeFilterCount > 0 ? (
                        <Badge size="xs" circle variant="filled">
                          {activeFilterCount}
                        </Badge>
                      ) : null
                    }
                    onClick={toggleFilter}
                  >
                    Filters
                  </Button>
                </Group>
              </Group>

              <Collapse in={filterOpen}>
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <TextInput
                        placeholder="Search by name..."
                        leftSection={<IoSearch size={16} />}
                        value={filters.search}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            search: e.currentTarget.value,
                          })
                        }
                        style={{ flex: 1, minWidth: 200 }}
                      />
                      {activeFilterCount > 0 && (
                        <Button
                          variant="subtle"
                          color="gray"
                          size="xs"
                          onClick={() => setFilters(EMPTY_FILTERS)}
                        >
                          Clear all
                        </Button>
                      )}
                    </Group>

                    {typeOptions.length > 0 && (
                      <Stack gap="xs">
                        <Text size="xs" fw={500} c="dimmed">
                          Type
                        </Text>
                        <Chip.Group
                          multiple
                          value={filters.types}
                          onChange={(val) =>
                            setFilters({ ...filters, types: val })
                          }
                        >
                          <Group gap="xs" wrap="wrap">
                            {typeOptions.map((type) => (
                              <Chip key={type} value={type} size="xs">
                                {type}
                              </Chip>
                            ))}
                          </Group>
                        </Chip.Group>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </Collapse>

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
