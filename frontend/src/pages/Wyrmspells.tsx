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
import { FACTION_ICON_MAP } from '../assets/faction';
import { getWyrmspellIcon } from '../assets/wyrmspell';
import type { ChipFilterGroup } from '../components/EntityFilter';
import EntityFilter from '../components/EntityFilter';
import FilterToolbar from '../components/FilterToolbar';
import GlobalBadge from '../components/GlobalBadge';
import LastUpdated from '../components/LastUpdated';
import ListPageShell from '../components/ListPageShell';
import QualityIcon from '../components/QualityIcon';
import { renderQualityFilterIcon } from '../components/renderQualityFilterIcon';
import SortableTh from '../components/SortableTh';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { QUALITY_ORDER } from '../constants/colors';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import {
  countActiveFilters,
  useFilterPanel,
  useFilters,
  useViewMode,
} from '../hooks/use-filters';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { Wyrmspell } from '../types/wyrmspell';
import { getLatestTimestamp } from '../utils';

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
    name: 'quality',
    label: 'Max Quality',
    type: 'select',
    required: true,
    options: ['UR', 'SSR'],
  },
  {
    name: 'effect',
    label: 'Effect (Max Quality)',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the effect at max quality',
  },
  {
    name: 'exclusive_faction',
    label: 'Exclusive Faction (optional)',
    type: 'select',
    options: [
      'Elemental Echo',
      'Wild Spirit',
      'Arcane Wisdom',
      'Sanctum Glory',
      'Otherworld Return',
      'Illusion Veil',
    ],
  },
  { name: 'is_global', label: 'Available on Global server', type: 'boolean' },
];

interface WyrmspellFilters {
  search: string;
  types: string[];
  qualities: string[];
}

const EMPTY_FILTERS: WyrmspellFilters = {
  search: '',
  types: [],
  qualities: [],
};

export default function Wyrmspells() {
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
  const { sortState, handleSort } = useSortState(STORAGE_KEY.WYRMSPELL_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const spell of wyrmspells) {
      if (spell.type) {
        types.add(spell.type);
      }
    }
    return [...types].sort();
  }, [wyrmspells]);

  const qualityOptions = useMemo(() => {
    const qualities = new Set<string>();
    for (const spell of wyrmspells) {
      if (spell.quality) {
        qualities.add(spell.quality);
      }
    }
    return [...qualities].sort();
  }, [wyrmspells]);

  const filterGroups: ChipFilterGroup[] = useMemo(() => {
    const groups: ChipFilterGroup[] = [];
    if (typeOptions.length > 0)
      groups.push({ key: 'types', label: 'Type', options: typeOptions });
    if (qualityOptions.length > 0)
      groups.push({
        key: 'qualities',
        label: 'Max Quality',
        options: qualityOptions,
        icon: renderQualityFilterIcon,
      });
    return groups;
  }, [typeOptions, qualityOptions]);

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
        if (
          filters.qualities.length > 0 &&
          !filters.qualities.includes(spell.quality)
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
          } else if (sortCol === 'type') {
            cmp = a.type.localeCompare(b.type);
          } else if (sortCol === 'quality') {
            const qA = QUALITY_ORDER.indexOf(a.quality);
            const qB = QUALITY_ORDER.indexOf(b.quality);
            cmp = (qA === -1 ? 999 : qA) - (qB === -1 ? 999 : qB);
          } else if (sortCol === 'faction') {
            const fA = a.exclusive_faction ?? '';
            const fB = b.exclusive_faction ?? '';
            // entries with no faction sort last
            if (!fA && fB) return 1;
            if (fA && !fB) return -1;
            cmp = fA.localeCompare(fB);
          } else if (sortCol === 'global') {
            cmp = (b.is_global ? 1 : 0) - (a.is_global ? 1 : 0);
          }
          if (cmp !== 0) return applyDir(cmp, sortDir);
        }
        // Default: type > quality > name
        const typeCmp = a.type.localeCompare(b.type);
        if (typeCmp !== 0) return typeCmp;
        const qA = QUALITY_ORDER.indexOf(a.quality);
        const qB = QUALITY_ORDER.indexOf(b.quality);
        if (qA !== qB) return (qA === -1 ? 999 : qA) - (qB === -1 ? 999 : qB);
        return a.name.localeCompare(b.name);
      });
  }, [wyrmspells, filters, sortCol, sortDir]);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(wyrmspells),
    [wyrmspells]
  );

  const activeFilterCount = countActiveFilters(filters);

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Wyrmspells</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Wyrmspell"
            modalTitle="Suggest a New Wyrmspell"
            issueTitle="[Wyrmspell] New wyrmspell suggestion"
            fields={WYRMSPELL_FIELDS}
          />
        </Group>

        <ListPageShell
          loading={loading}
          error={error}
          errorTitle="Could not load wyrmspells"
          hasData={wyrmspells.length > 0}
          emptyMessage="No wyrmspell data available yet."
          skeletonCards={4}
        >
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
                  selected={{
                    types: filters.types,
                    qualities: filters.qualities,
                  }}
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
                    const factionIcon = spell.exclusive_faction
                      ? FACTION_ICON_MAP[spell.exclusive_faction]
                      : undefined;
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
                              <QualityIcon quality={spell.quality} />
                              <Text fw={600}>{spell.name}</Text>
                            </Group>
                            <Group gap="sm" wrap="wrap">
                              <Badge variant="light" size="sm">
                                {spell.type}
                              </Badge>
                              <GlobalBadge
                                isGlobal={spell.is_global}
                                size="sm"
                              />
                              {spell.exclusive_faction && (
                                <Tooltip label={spell.exclusive_faction}>
                                  <Image
                                    src={factionIcon}
                                    alt={spell.exclusive_faction}
                                    w={20}
                                    h={20}
                                  />
                                </Tooltip>
                              )}
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
                  <Table striped highlightOnHover style={{ minWidth: 800 }}>
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
                        <SortableTh
                          sortKey="quality"
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                        >
                          Max Quality
                        </SortableTh>
                        <SortableTh
                          sortKey="faction"
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                        >
                          Faction
                        </SortableTh>
                        <SortableTh
                          sortKey="global"
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                        >
                          Global
                        </SortableTh>
                        <Table.Th>Effect (Max Quality)</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filtered.map((spell) => {
                        const iconSrc = getWyrmspellIcon(spell.name);
                        const factionIcon = spell.exclusive_faction
                          ? FACTION_ICON_MAP[spell.exclusive_faction]
                          : undefined;
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
                              <QualityIcon quality={spell.quality} />
                            </Table.Td>
                            <Table.Td>
                              {spell.exclusive_faction ? (
                                <Tooltip label={spell.exclusive_faction}>
                                  <Image
                                    src={factionIcon}
                                    alt={spell.exclusive_faction}
                                    w={24}
                                    h={24}
                                  />
                                </Tooltip>
                              ) : (
                                <Text size="sm" c="dimmed">
                                  —
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <GlobalBadge
                                isGlobal={spell.is_global}
                                size="sm"
                              />
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
        </ListPageShell>
      </Stack>
    </Container>
  );
}
