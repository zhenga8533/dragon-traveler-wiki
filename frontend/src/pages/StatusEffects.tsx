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
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import EntityFilter from '../components/common/EntityFilter';
import FilteredListShell from '../components/layout/FilteredListShell';
import LastUpdated from '../components/common/LastUpdated';
import ListPageShell from '../components/layout/ListPageShell';
import RichText from '../components/common/RichText';
import SortableTh from '../components/common/SortableTh';
import SuggestModal, { type FieldDef } from '../components/tools/SuggestModal';
import { STATE_COLOR, STATE_ORDER } from '../constants/colors';
import { PAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { countActiveFilters, useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { StatusEffect, StatusEffectType } from '../types/status-effect';
import { getLatestTimestamp } from '../utils';

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
  const { sortState, handleSort } = useSortState(
    STORAGE_KEY.STATUS_EFFECT_SORT
  );
  const { col: sortCol, dir: sortDir } = sortState;

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
        if (sortCol) {
          let cmp = 0;
          if (sortCol === 'name') {
            cmp = a.name.localeCompare(b.name);
          } else if (sortCol === 'type') {
            cmp = STATE_ORDER.indexOf(a.type) - STATE_ORDER.indexOf(b.type);
          }
          if (cmp !== 0) return applyDir(cmp, sortDir);
        }
        // Default: type > name
        const typeIndexA = STATE_ORDER.indexOf(a.type);
        const typeIndexB = STATE_ORDER.indexOf(b.type);
        if (typeIndexA !== typeIndexB) return typeIndexA - typeIndexB;
        return a.name.localeCompare(b.name);
      });
  }, [effects, filters, sortCol, sortDir]);

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length, PAGE_SIZE, JSON.stringify(filters)
  );
  const pageItems = filtered.slice(offset, offset + PAGE_SIZE);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(effects),
    [effects]
  );

  const activeFilterCount = countActiveFilters(filters);

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

        <ListPageShell
          loading={loading}
          error={error}
          errorTitle="Could not load status effects"
          hasData={effects.length > 0}
          emptyMessage="No status effect data available yet."
          skeletonCards={4}
        >
          <FilteredListShell
            count={filtered.length}
            noun="status effect"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterToggle={toggleFilter}
            filterContent={
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
            }
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {pageItems.map((effect) => {
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
                              loading="lazy"
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
            }
            tableContent={
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
                        sortKey="type"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Type
                      </SortableTh>
                      <Table.Th>Effect</Table.Th>
                      <Table.Th>Remark</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageItems.map((effect) => {
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
                                loading="lazy"
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
            }
          />
        </ListPageShell>
      </Stack>
    </Container>
  );
}
