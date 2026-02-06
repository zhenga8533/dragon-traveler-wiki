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
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import { IoFilter, IoGrid, IoList, IoSearch } from 'react-icons/io5';
import { getStatusEffectIcon } from '../assets/status_effect';
import RichText from '../components/RichText';
import SuggestModal from '../components/SuggestModal';
import { STATE_COLOR, STATE_ORDER } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { StatusEffect, StatusEffectType } from '../types/status-effect';
import { STATUS_EFFECT_JSON_TEMPLATE } from '../utils/github-issues';

interface StatusEffectFilters {
  search: string;
  types: StatusEffectType[];
}

const EMPTY_FILTERS: StatusEffectFilters = {
  search: '',
  types: [],
};

type ViewMode = 'list' | 'grid';

export default function StatusEffects() {
  const { data: effects, loading } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );
  const [filters, setFilters] = useState<StatusEffectFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filtered = useMemo(() => {
    return effects
      .filter((effect) => {
        if (
          filters.search &&
          !effect.name.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false;
        }
        if (filters.types.length > 0 && !filters.types.includes(effect.type)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const typeIndexA = STATE_ORDER.indexOf(a.type);
        const typeIndexB = STATE_ORDER.indexOf(b.type);
        if (typeIndexA !== typeIndexB) {
          return typeIndexA - typeIndexB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [effects, filters]);

  const activeFilterCount = (filters.search ? 1 : 0) + filters.types.length;
  const totalFiltered = filtered.length;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Status Effects</Title>
          <SuggestModal
            buttonLabel="Suggest a Status Effect"
            modalTitle="Suggest a New Status Effect"
            jsonTemplate={STATUS_EFFECT_JSON_TEMPLATE}
            issueLabel="status-effect"
            issueTitle="[Status Effect] New status effect suggestion"
          />
        </Group>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && effects.length === 0 && (
          <Text c="dimmed">No status effect data available yet.</Text>
        )}

        {!loading && effects.length > 0 && (
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                  {totalFiltered} status effect{totalFiltered !== 1 ? 's' : ''}
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

                    <Stack gap="xs">
                      <Text size="xs" fw={500} c="dimmed">
                        Type
                      </Text>
                      <Chip.Group
                        multiple
                        value={filters.types}
                        onChange={(val) =>
                          setFilters({
                            ...filters,
                            types: val as StatusEffectType[],
                          })
                        }
                      >
                        <Group gap="xs" wrap="wrap">
                          {STATE_ORDER.map((type) => (
                            <Chip key={type} value={type} size="xs">
                              {type}
                            </Chip>
                          ))}
                        </Group>
                      </Chip.Group>
                    </Stack>
                  </Stack>
                </Paper>
              </Collapse>

              {filtered.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">
                  No status effects match the current filters.
                </Text>
              ) : viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  {filtered.map((effect) => {
                    const iconSrc = getStatusEffectIcon(effect.name);
                    return (
                      <Paper key={effect.name} p="sm" radius="md" withBorder>
                        <Stack gap="xs">
                          <Group gap="sm" wrap="nowrap">
                            {iconSrc && (
                              <Image
                                src={iconSrc}
                                alt={effect.name}
                                w={28}
                                h={28}
                                fit="contain"
                              />
                            )}
                            <Text fw={600}>{effect.name}</Text>
                            <Badge
                              variant="light"
                              color={STATE_COLOR[effect.type]}
                              size="sm"
                            >
                              {effect.type}
                            </Badge>
                          </Group>
                          <RichText
                            text={effect.effect}
                            statusEffects={effects}
                          />
                          {effect.remark && (
                            <Text size="xs" c="dimmed" fs="italic">
                              {effect.remark}
                            </Text>
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </SimpleGrid>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Icon</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Effect</Table.Th>
                      <Table.Th>Remark</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filtered.map((effect) => {
                      const iconSrc = getStatusEffectIcon(effect.name);
                      return (
                        <Table.Tr key={effect.name}>
                          <Table.Td>
                            {iconSrc && (
                              <Image
                                src={iconSrc}
                                alt={effect.name}
                                w={28}
                                h={28}
                                fit="contain"
                              />
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} size="sm">
                              {effect.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              color={STATE_COLOR[effect.type]}
                              size="sm"
                            >
                              {effect.type}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <RichText
                              text={effect.effect}
                              statusEffects={effects}
                            />
                          </Table.Td>
                          <Table.Td>
                            {effect.remark ? (
                              <Text size="xs" c="dimmed" fs="italic">
                                {effect.remark}
                              </Text>
                            ) : (
                              <Text size="xs" c="dimmed">
                                -
                              </Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
