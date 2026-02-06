import {
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
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import { IoFilter, IoSearch } from 'react-icons/io5';
import { getWyrmspellIcon } from '../assets/wyrmspell';
import SuggestModal from '../components/SuggestModal';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Wyrmspell } from '../types/wyrmspell';
import { WYRMSPELL_JSON_TEMPLATE } from '../utils/github-issues';

interface WyrmspellFilters {
  search: string;
  types: string[];
}

const EMPTY_FILTERS: WyrmspellFilters = {
  search: '',
  types: [],
};

export default function DragonSpells() {
  const { data: wyrmspells, loading } = useDataFetch<Wyrmspell[]>(
    'data/wyrmspells.json',
    []
  );
  const [filters, setFilters] = useState<WyrmspellFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);

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
            jsonTemplate={WYRMSPELL_JSON_TEMPLATE}
            issueLabel="wyrmspell"
            issueTitle="[Wyrmspell] New wyrmspell suggestion"
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
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                  {filtered.length} wyrmspell{filtered.length !== 1 ? 's' : ''}
                </Text>
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

              <Collapse in={filterOpen}>
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group justify="space-between" align="center">
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
                        style={{ flex: 1 }}
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
              ) : (
                <Stack gap="sm">
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
                </Stack>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
