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
import { getStatusEffectIcon } from '../assets/status_effect';
import DataFetchError from '../components/DataFetchError';
import type { ChipFilterGroup } from '../components/EntityFilter';
import EntityFilter from '../components/EntityFilter';
import FilterToolbar from '../components/FilterToolbar';
import { ListPageLoading } from '../components/PageLoadingSkeleton';
import RichText from '../components/RichText';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { STATE_COLOR, STATE_ORDER } from '../constants/colors';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import type { StatusEffect, StatusEffectType } from '../types/status-effect';
import LastUpdated from '../components/LastUpdated';

const STATUS_EFFECT_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Status effect name',
  },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [
      'Buff',
      'Debuff',
      'Special',
      'Control',
      'Elemental',
      'Blessing',
      'Exclusive',
    ],
  },
  {
    name: 'effect',
    label: 'Effect',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the effect',
  },
  {
    name: 'remark',
    label: 'Remark (optional)',
    type: 'textarea',
    placeholder: 'Additional notes',
  },
];

interface StatusEffectFilters {
  search: string;
  types: StatusEffectType[];
}

const EMPTY_FILTERS: StatusEffectFilters = {
  search: '',
  types: [],
};

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'types',
    label: 'Type',
    options: [...STATE_ORDER],
  },
];

export default function StatusEffects() {
  const {
    data: effects,
    loading,
    error,
  } = useDataFetch<StatusEffect[]>('data/status-effects.json', []);
  const { filters, setFilters } = useFilters<StatusEffectFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.STATUS_EFFECT_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.STATUS_EFFECT_VIEW_MODE,
    defaultMode: 'list',
  });

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

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const se of effects) {
      if (se.last_updated > latest) latest = se.last_updated;
    }
    return latest;
  }, [effects]);

  const activeFilterCount = (filters.search ? 1 : 0) + filters.types.length;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Status Effects</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Status Effect"
            modalTitle="Suggest a New Status Effect"
            issueTitle="[Status Effect] New status effect suggestion"
            fields={STATUS_EFFECT_FIELDS}
          />
        </Group>

        {loading && <ListPageLoading cards={4} />}

        {!loading && error && (
          <DataFetchError
            title="Could not load status effects"
            message={error.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && effects.length === 0 && (
          <Text c="dimmed">No status effect data available yet.</Text>
        )}

        {!loading && !error && effects.length > 0 && (
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <FilterToolbar
                count={filtered.length}
                noun="status effect"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
              >
                <EntityFilter
                  groups={FILTER_GROUPS}
                  selected={{ types: filters.types }}
                  onChange={(key, values) =>
                    setFilters({
                      ...filters,
                      [key]: values as StatusEffectType[],
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
                <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                  <Table striped highlightOnHover style={{ minWidth: 720 }}>
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
                                  w={32}
                                  h={32}
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
                </ScrollArea>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
