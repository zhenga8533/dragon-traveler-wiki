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
  UnstyledButton,
} from '@mantine/core';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortrait } from '../assets/character';
import { getNoblePhantasmIcon } from '../assets/noble_phantasm';
import DataFetchError from '../components/DataFetchError';
import EntityFilter from '../components/EntityFilter';
import FilterToolbar from '../components/FilterToolbar';
import LastUpdated from '../components/LastUpdated';
import { ListPageLoading } from '../components/PageLoadingSkeleton';
import SortableTh from '../components/SortableTh';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { CARD_HOVER_STYLES, cardHoverHandlers } from '../constants/styles';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { NoblePhantasm } from '../types/noble-phantasm';

const NOBLE_PHANTASM_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Noble Phantasm name',
  },
  {
    name: 'character',
    label: 'Character (optional)',
    type: 'text',
    placeholder: 'e.g. Jing',
  },
  {
    name: 'is_global',
    label: 'Available on Global server',
    type: 'boolean',
  },
  {
    name: 'lore',
    label: 'Lore',
    type: 'textarea',
    required: true,
    placeholder: 'Noble Phantasm lore',
  },
];

interface NoblePhantasmFilters {
  search: string;
}

const EMPTY_FILTERS: NoblePhantasmFilters = {
  search: '',
};

export default function NoblePhantasms() {
  const navigate = useNavigate();
  const {
    data: noblePhantasms,
    loading,
    error,
  } = useDataFetch<NoblePhantasm[]>('data/noble_phantasm.json', []);

  const { filters, setFilters } = useFilters<NoblePhantasmFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.NOBLE_PHANTASM_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.NOBLE_PHANTASM_VIEW_MODE,
    defaultMode: 'grid',
  });
  const { sortState, handleSort } = useSortState(
    STORAGE_KEY.NOBLE_PHANTASM_SORT
  );
  const { col: sortCol, dir: sortDir } = sortState;

  const filtered = useMemo(() => {
    return noblePhantasms
      .filter((np) => {
        if (!filters.search) return true;
        const q = filters.search.toLowerCase();
        return (
          np.name.toLowerCase().includes(q) ||
          (np.character || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortCol) {
          let cmp = 0;
          if (sortCol === 'name') {
            cmp = a.name.localeCompare(b.name);
          } else if (sortCol === 'character') {
            const cA = a.character ?? '';
            const cB = b.character ?? '';
            if (!cA && cB) return 1;
            if (cA && !cB) return -1;
            cmp = cA.localeCompare(cB);
          } else if (sortCol === 'effects') {
            cmp = b.effects.length - a.effects.length;
          } else if (sortCol === 'skills') {
            cmp = b.skills.length - a.skills.length;
          } else if (sortCol === 'global') {
            cmp = (b.is_global ? 1 : 0) - (a.is_global ? 1 : 0);
          }
          if (cmp !== 0) return applyDir(cmp, sortDir);
        }
        const charCmp = (a.character ?? '').localeCompare(b.character ?? '');
        if (charCmp !== 0) return charCmp;
        return a.name.localeCompare(b.name);
      });
  }, [noblePhantasms, filters.search, sortCol, sortDir]);

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const np of noblePhantasms) {
      const ts = np.last_updated ?? 0;
      if (ts > latest) latest = ts;
    }
    return latest;
  }, [noblePhantasms]);

  const activeFilterCount = filters.search ? 1 : 0;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Noble Phantasms</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Noble Phantasm"
            modalTitle="Suggest a New Noble Phantasm"
            issueTitle="[Noble Phantasm] New noble phantasm suggestion"
            fields={NOBLE_PHANTASM_FIELDS}
          />
        </Group>

        {loading && <ListPageLoading cards={4} />}

        {!loading && error && (
          <DataFetchError
            title="Could not load noble phantasms"
            message={error.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && noblePhantasms.length === 0 && (
          <Text c="dimmed">No noble phantasm data available yet.</Text>
        )}

        {!loading && !error && noblePhantasms.length > 0 && (
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <FilterToolbar
                count={filtered.length}
                noun="noble phantasm"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
              >
                <EntityFilter
                  groups={[]}
                  selected={{}}
                  onChange={() => {}}
                  onClear={() => setFilters(EMPTY_FILTERS)}
                  search={filters.search}
                  onSearchChange={(value) =>
                    setFilters({ ...filters, search: value })
                  }
                  searchPlaceholder="Search by name or character..."
                />
              </FilterToolbar>

              {filtered.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">
                  No noble phantasms match the current filters.
                </Text>
              ) : viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {filtered.map((np) => {
                    const iconSrc = getNoblePhantasmIcon(np.name);
                    const portrait = np.character
                      ? getPortrait(np.character)
                      : undefined;
                    return (
                      <Paper
                        key={np.name}
                        p="md"
                        radius="md"
                        withBorder
                        style={CARD_HOVER_STYLES}
                        {...cardHoverHandlers}
                        onClick={() =>
                          navigate(
                            `/noble-phantasms/${encodeURIComponent(np.name)}`
                          )
                        }
                      >
                        <Group gap="md" align="flex-start" wrap="nowrap">
                          {iconSrc && (
                            <Image
                              src={iconSrc}
                              alt={np.name}
                              w={56}
                              h={56}
                              fit="contain"
                              radius="sm"
                            />
                          )}
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Group gap="xs" align="center" wrap="nowrap">
                              {portrait && (
                                <Image
                                  src={portrait}
                                  alt={np.character || ''}
                                  w={20}
                                  h={20}
                                  fit="cover"
                                  radius="xl"
                                />
                              )}
                              <Text fw={700} c="violet" lineClamp={1}>
                                {np.name}
                              </Text>
                            </Group>
                            <Group gap="xs" wrap="wrap">
                              {np.character && (
                                <Badge variant="light" size="sm" color="blue">
                                  {np.character}
                                </Badge>
                              )}
                              <Badge
                                variant="light"
                                size="sm"
                                color={np.is_global ? 'green' : 'orange'}
                              >
                                {np.is_global ? 'Global' : 'TW / CN'}
                              </Badge>
                              <Badge variant="light" size="sm" color="grape">
                                {np.effects.length} effect
                                {np.effects.length !== 1 ? 's' : ''}
                              </Badge>
                              <Badge variant="light" size="sm" color="indigo">
                                {np.skills.length} skill
                                {np.skills.length !== 1 ? 's' : ''}
                              </Badge>
                            </Group>
                            <Tooltip label={np.lore} multiline maw={360}>
                              <Text size="xs" c="dimmed" lineClamp={2}>
                                {np.lore}
                              </Text>
                            </Tooltip>
                          </Stack>
                        </Group>
                      </Paper>
                    );
                  })}
                </SimpleGrid>
              ) : (
                <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                  <Table striped highlightOnHover style={{ minWidth: 820 }}>
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
                          sortKey="character"
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                        >
                          Character
                        </SortableTh>
                        <SortableTh
                          sortKey="effects"
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                        >
                          Effects
                        </SortableTh>
                        <SortableTh
                          sortKey="skills"
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                        >
                          Skills
                        </SortableTh>
                        <SortableTh
                          sortKey="global"
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                        >
                          Global
                        </SortableTh>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filtered.map((np) => {
                        const iconSrc = getNoblePhantasmIcon(np.name);
                        const portrait = np.character
                          ? getPortrait(np.character)
                          : undefined;
                        return (
                          <Table.Tr
                            key={np.name}
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              navigate(
                                `/noble-phantasms/${encodeURIComponent(np.name)}`
                              )
                            }
                          >
                            <Table.Td>
                              {iconSrc ? (
                                <Image
                                  src={iconSrc}
                                  alt={np.name}
                                  w={40}
                                  h={40}
                                  fit="contain"
                                  radius="sm"
                                />
                              ) : (
                                <Text c="dimmed" size="sm">
                                  —
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <UnstyledButton>
                                <Text size="sm" fw={600} c="violet">
                                  {np.name}
                                </Text>
                              </UnstyledButton>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                {portrait && (
                                  <Image
                                    src={portrait}
                                    alt={np.character || ''}
                                    w={20}
                                    h={20}
                                    fit="cover"
                                    radius="xl"
                                  />
                                )}
                                <Text
                                  size="sm"
                                  c={np.character ? undefined : 'dimmed'}
                                  lineClamp={1}
                                >
                                  {np.character || '—'}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{np.effects.length}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{np.skills.length}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                variant="light"
                                size="sm"
                                color={np.is_global ? 'green' : 'orange'}
                              >
                                {np.is_global ? 'Global' : 'TW / CN'}
                              </Badge>
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
