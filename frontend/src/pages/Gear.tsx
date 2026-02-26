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
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router-dom';
import { GEAR_TYPE_ICON_MAP, getGearIcon } from '../assets/gear';
import { QUALITY_ICON_MAP } from '../assets/quality';
import GearTypeTag from '../components/common/GearTypeTag';
import LastUpdated from '../components/common/LastUpdated';
import PaginationControl from '../components/common/PaginationControl';
import QualityIcon from '../components/common/QualityIcon';
import SortableTh from '../components/common/SortableTh';
import type { ChipFilterGroup } from '../components/EntityFilter';
import EntityFilter from '../components/EntityFilter';
import FilterToolbar from '../components/layout/FilterToolbar';
import ListPageShell from '../components/layout/ListPageShell';
import SuggestModal, {
  type ArrayFieldDef,
  type FieldDef,
} from '../components/tools/SuggestModal';
import { QUALITY_ORDER } from '../constants/colors';
import {
  CARD_HOVER_STYLES,
  CURSOR_POINTER_STYLE,
  FLEX_1_STYLE,
  LINK_BLOCK_RESET_STYLE,
  LINK_RESET_STYLE,
  cardHoverHandlers,
} from '../constants/styles';
import { PAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks';
import { useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { Gear, GearSet, GearType } from '../types/gear';
import type { Quality } from '../types/quality';
import { getLatestTimestamp } from '../utils';

const GEAR_TYPE_ORDER: GearType[] = [
  'Headgear',
  'Chestplate',
  'Bracers',
  'Boots',
  'Weapon',
  'Accessory',
];

const GEAR_SET_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Gear set name',
  },
  {
    name: 'bonus_quantity',
    label: 'Set Bonus Quantity',
    type: 'number',
    required: true,
    placeholder: 'e.g. 2 (use 0 for no set bonus)',
  },
  {
    name: 'bonus_description',
    label: 'Set Bonus Description',
    type: 'textarea',
    placeholder: 'Describe the set bonus effect',
  },
];

const GEAR_STATS_ARRAY_FIELDS: ArrayFieldDef[] = [
  {
    name: 'stats',
    label: 'Stats',
    minItems: 1,
    toDict: { key: 'stat', value: 'value' },
    fields: [
      {
        name: 'stat',
        label: 'Stat Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. HP',
      },
      {
        name: 'value',
        label: 'Value',
        type: 'text',
        required: true,
        placeholder: 'e.g. 11810',
      },
    ],
  },
];

interface GearFilters {
  search: string;
  types: GearType[];
  qualities: Quality[];
}

const EMPTY_FILTERS: GearFilters = {
  search: '',
  types: [],
  qualities: [],
};

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'types',
    label: 'Type',
    options: [...GEAR_TYPE_ORDER],
    icon: (value: string) => {
      const iconSrc = GEAR_TYPE_ICON_MAP[value as GearType];
      if (!iconSrc) return null;
      return <Image src={iconSrc} alt={value} w={14} h={14} fit="contain" />;
    },
  },
  {
    key: 'qualities',
    label: 'Quality',
    options: [...QUALITY_ORDER],
    icon: (value: string) => {
      const iconSrc = QUALITY_ICON_MAP[value as Quality];
      if (!iconSrc) return null;
      return <Image src={iconSrc} alt={value} w={14} h={14} fit="contain" />;
    },
  },
];

export default function GearPage() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'gear';
    return window.localStorage.getItem(STORAGE_KEY.GEAR_TAB) || 'gear';
  });

  const handleTabChange = (value: string | null) => {
    const tab = value ?? 'gear';
    setActiveTab(tab);
    window.localStorage.setItem(STORAGE_KEY.GEAR_TAB, tab);
  };

  const navigate = useNavigate();
  const {
    data: gear,
    loading,
    error,
  } = useDataFetch<Gear[]>('data/gear.json', []);
  const {
    data: gearSets,
    loading: gearSetsLoading,
    error: gearSetsError,
  } = useDataFetch<GearSet[]>('data/gear_sets.json', []);

  const gearSetOptions = useMemo(
    () =>
      [...new Set(gearSets.map((entry) => entry.name))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [gearSets]
  );

  const gearFields = useMemo<FieldDef[]>(
    () => [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Gear name',
      },
      {
        name: 'set',
        label: 'Set',
        type: 'select',
        required: true,
        options: gearSetOptions,
        placeholder: 'Select a gear set',
      },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: GEAR_TYPE_ORDER,
      },
      {
        name: 'quality',
        label: 'Quality',
        type: 'select',
        required: true,
        options: QUALITY_ORDER,
      },
      {
        name: 'lore',
        label: 'Lore',
        type: 'textarea',
        required: true,
        placeholder: 'Gear lore text',
      },
    ],
    [gearSetOptions]
  );

  const { filters, setFilters } = useFilters<GearFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.GEAR_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.GEAR_VIEW_MODE,
    defaultMode: 'grid',
  });
  const { sortState, handleSort } = useSortState(STORAGE_KEY.GEAR_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

  const filtered = useMemo(() => {
    return gear
      .filter((item) => {
        if (
          !filters.search &&
          filters.types.length === 0 &&
          filters.qualities.length === 0
        ) {
          return true;
        }
        const query = filters.search.toLowerCase();
        const matchesSearch =
          !filters.search ||
          item.name.toLowerCase().includes(query) ||
          item.set.toLowerCase().includes(query);
        const matchesType =
          filters.types.length === 0 || filters.types.includes(item.type);
        const matchesQuality =
          filters.qualities.length === 0 ||
          filters.qualities.includes(item.quality);
        return matchesSearch && matchesType && matchesQuality;
      })
      .sort((a, b) => {
        const typeCmp =
          GEAR_TYPE_ORDER.indexOf(a.type) - GEAR_TYPE_ORDER.indexOf(b.type);
        const qualityCmp =
          QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
        const nameCmp = a.name.localeCompare(b.name);

        if (sortCol) {
          let cmp = 0;
          if (sortCol === 'name') {
            cmp = nameCmp;
          } else if (sortCol === 'set') {
            cmp = a.set.localeCompare(b.set);
          } else if (sortCol === 'type') {
            cmp = typeCmp || qualityCmp || nameCmp;
          }
          if (cmp !== 0) return applyDir(cmp, sortDir);
        }

        if (typeCmp !== 0) return typeCmp;
        if (qualityCmp !== 0) return qualityCmp;
        return nameCmp;
      });
  }, [gear, filters, sortCol, sortDir]);

  const {
    page: gearPage,
    setPage: setGearPage,
    totalPages: gearTotalPages,
    offset: gearOffset,
  } = usePagination(filtered.length, PAGE_SIZE, JSON.stringify(filters));
  const gearPageItems = filtered.slice(gearOffset, gearOffset + PAGE_SIZE);

  const gearSetByName = useMemo(
    () => new Map(gearSets.map((entry) => [entry.name, entry])),
    [gearSets]
  );

  const gearItemsBySet = useMemo(() => {
    const map = new Map<string, Gear[]>();
    for (const item of gear) {
      const list = map.get(item.set) ?? [];
      list.push(item);
      map.set(item.set, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const typeCmp =
          GEAR_TYPE_ORDER.indexOf(a.type) - GEAR_TYPE_ORDER.indexOf(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [gear]);

  const [gearSetSearch, setGearSetSearch] = useState('');

  const filteredGearSets = useMemo(() => {
    const query = gearSetSearch.trim().toLowerCase();
    return gearSets
      .filter((set) => {
        if (!query) return true;
        const bonusDesc = set.set_bonus?.description ?? '';
        return (
          set.name.toLowerCase().includes(query) ||
          bonusDesc.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [gearSets, gearSetSearch]);

  const {
    page: gearSetPage,
    setPage: setGearSetPage,
    totalPages: gearSetTotalPages,
    offset: gearSetOffset,
  } = usePagination(filteredGearSets.length, PAGE_SIZE, gearSetSearch);
  const gearSetPageItems = filteredGearSets.slice(
    gearSetOffset,
    gearSetOffset + PAGE_SIZE
  );

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(gear), [gear]);
  const mostRecentSetUpdate = useMemo(
    () => getLatestTimestamp(gearSets),
    [gearSets]
  );
  const activeFilterCount =
    (filters.search ? 1 : 0) + filters.types.length + filters.qualities.length;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Gear</Title>
            <LastUpdated
              timestamp={
                activeTab === 'gear-sets'
                  ? mostRecentSetUpdate
                  : mostRecentUpdate
              }
            />
          </Group>
          {activeTab === 'gear-sets' ? (
            <SuggestModal
              buttonLabel="Suggest Gear Set"
              modalTitle="Suggest New Gear Set"
              issueTitle="[Gear Set] New gear set suggestion"
              fields={GEAR_SET_FIELDS}
            />
          ) : (
            <SuggestModal
              buttonLabel="Suggest Gear"
              modalTitle="Suggest New Gear"
              issueTitle="[Gear] New gear suggestion"
              fields={gearFields}
              arrayFields={GEAR_STATS_ARRAY_FIELDS}
            />
          )}
        </Group>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="gear">Gear</Tabs.Tab>
            <Tabs.Tab value="gear-sets">Gear Sets</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="gear" pt="md">
            <ListPageShell
              loading={loading}
              error={error}
              errorTitle="Could not load gear"
              hasData={gear.length > 0}
              emptyMessage="No gear data available yet."
              skeletonCards={4}
            >
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <FilterToolbar
                    count={filtered.length}
                    noun="gear item"
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    filterCount={activeFilterCount}
                    filterOpen={filterOpen}
                    onFilterToggle={toggleFilter}
                  >
                    <EntityFilter
                      groups={FILTER_GROUPS}
                      selected={{
                        types: filters.types,
                        qualities: filters.qualities,
                      }}
                      onChange={(key, values) => {
                        if (key === 'types') {
                          setFilters({
                            ...filters,
                            types: values as GearType[],
                          });
                          return;
                        }
                        if (key === 'qualities') {
                          setFilters({
                            ...filters,
                            qualities: values as Quality[],
                          });
                        }
                      }}
                      onClear={() => setFilters(EMPTY_FILTERS)}
                      search={filters.search}
                      onSearchChange={(value) =>
                        setFilters({ ...filters, search: value })
                      }
                      searchPlaceholder="Search by gear or set..."
                    />
                  </FilterToolbar>

                  {filtered.length === 0 ? (
                    <Text c="dimmed" size="sm" ta="center" py="md">
                      No gear matches the current filters.
                    </Text>
                  ) : viewMode === 'grid' ? (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      {gearPageItems.map((item) => {
                        const setData = gearSetByName.get(item.set);
                        const setBonus = setData?.set_bonus ?? item.set_bonus;
                        const iconSrc = getGearIcon(item.type, item.name);
                        return (
                          <Paper
                            key={item.name}
                            component={Link}
                            to={`/gear-sets/${encodeURIComponent(item.set)}`}
                            p="md"
                            radius="md"
                            withBorder
                            style={{
                              ...CARD_HOVER_STYLES,
                              ...LINK_BLOCK_RESET_STYLE,
                            }}
                            {...cardHoverHandlers}
                          >
                            <Group gap="md" align="flex-start" wrap="nowrap">
                              {iconSrc && (
                                <Image
                                  src={iconSrc}
                                  alt={item.name}
                                  w={64}
                                  h={64}
                                  fit="contain"
                                  radius="sm"
                                />
                              )}
                              <Stack gap={4} style={FLEX_1_STYLE}>
                                <Group gap="xs" wrap="wrap">
                                  <Text fw={700} c="violet" lineClamp={1}>
                                    {item.name}
                                  </Text>
                                  {item.quality && (
                                    <QualityIcon quality={item.quality} />
                                  )}
                                </Group>
                                <Group gap="xs" wrap="wrap">
                                  <GearTypeTag type={item.type} />
                                  <Badge
                                    variant="light"
                                    size="sm"
                                    color="grape"
                                  >
                                    {item.set}
                                  </Badge>
                                  {setBonus && setBonus.quantity > 0 && (
                                    <Badge
                                      variant="outline"
                                      size="sm"
                                      color="gray"
                                    >
                                      {setBonus.quantity}-piece set
                                    </Badge>
                                  )}
                                </Group>
                                <Text size="xs" c="dimmed" lineClamp={2}>
                                  {item.lore}
                                </Text>
                              </Stack>
                            </Group>
                          </Paper>
                        );
                      })}
                    </SimpleGrid>
                  ) : (
                    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                      <Table striped highlightOnHover style={{ minWidth: 760 }}>
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
                              sortKey="set"
                              sortCol={sortCol}
                              sortDir={sortDir}
                              onSort={handleSort}
                            >
                              Set
                            </SortableTh>
                            <Table.Th>Rarity</Table.Th>
                            <Table.Th>Set Bonus</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {gearPageItems.map((item) => {
                            const setData = gearSetByName.get(item.set);
                            const setBonus =
                              setData?.set_bonus ?? item.set_bonus;
                            const iconSrc = getGearIcon(item.type, item.name);
                            return (
                              <Table.Tr
                                key={item.name}
                                style={CURSOR_POINTER_STYLE}
                                onClick={() =>
                                  navigate(
                                    `/gear-sets/${encodeURIComponent(item.set)}`
                                  )
                                }
                              >
                                <Table.Td>
                                  {iconSrc && (
                                    <Image
                                      src={iconSrc}
                                      alt={item.name}
                                      w={32}
                                      h={32}
                                      fit="contain"
                                    />
                                  )}
                                </Table.Td>
                                <Table.Td>
                                  <Text
                                    component={Link}
                                    to={`/gear-sets/${encodeURIComponent(item.set)}`}
                                    fw={600}
                                    size="sm"
                                    c="violet"
                                    style={LINK_RESET_STYLE}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {item.name}
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <GearTypeTag type={item.type} />
                                </Table.Td>
                                <Table.Td>
                                  <Badge
                                    variant="light"
                                    size="sm"
                                    color="grape"
                                  >
                                    {item.set}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  {item.quality && (
                                    <QualityIcon quality={item.quality} />
                                  )}
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm" c="dimmed">
                                    {setBonus && setBonus.quantity > 0
                                      ? `${setBonus.quantity}-piece: ${setBonus.description}`
                                      : '—'}
                                  </Text>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  )}

                  <PaginationControl
                    currentPage={gearPage}
                    totalPages={gearTotalPages}
                    onChange={setGearPage}
                  />
                </Stack>
              </Paper>
            </ListPageShell>
          </Tabs.Panel>

          <Tabs.Panel value="gear-sets" pt="md">
            <ListPageShell
              loading={gearSetsLoading}
              error={gearSetsError}
              errorTitle="Could not load gear sets"
              hasData={gearSets.length > 0}
              emptyMessage="No gear set data available yet."
              skeletonCards={4}
            >
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <TextInput
                    placeholder="Search by set name or bonus..."
                    leftSection={<IoSearch size={14} />}
                    value={gearSetSearch}
                    onChange={(e) => setGearSetSearch(e.currentTarget.value)}
                  />

                  {filteredGearSets.length === 0 ? (
                    <Text c="dimmed" size="sm" ta="center" py="md">
                      No gear sets match the search.
                    </Text>
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      {gearSetPageItems.map((set) => {
                        const items = gearItemsBySet.get(set.name) ?? [];
                        return (
                          <Paper
                            key={set.name}
                            component={Link}
                            to={`/gear-sets/${encodeURIComponent(set.name)}`}
                            p="md"
                            radius="md"
                            withBorder
                            style={{
                              ...CARD_HOVER_STYLES,
                              ...LINK_BLOCK_RESET_STYLE,
                            }}
                            {...cardHoverHandlers}
                          >
                            <Stack gap="xs">
                              <Group justify="space-between" align="center">
                                <Text fw={700} c="violet" lineClamp={1}>
                                  {set.name}
                                </Text>
                                {set.set_bonus.quantity > 0 && (
                                  <Badge
                                    variant="outline"
                                    size="sm"
                                    color="gray"
                                  >
                                    {set.set_bonus.quantity}-piece
                                  </Badge>
                                )}
                              </Group>

                              <Text size="sm" c="dimmed">
                                {set.set_bonus.quantity > 0
                                  ? set.set_bonus.description ||
                                    'No set bonus description.'
                                  : 'No set bonus.'}
                              </Text>

                              <Group gap="xs" wrap="wrap">
                                <Badge variant="light" size="sm" color="grape">
                                  {items.length} item
                                  {items.length === 1 ? '' : 's'}
                                </Badge>
                                {items.slice(0, 4).map((item) => (
                                  <GearTypeTag
                                    key={item.name}
                                    type={item.type}
                                  />
                                ))}
                              </Group>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </SimpleGrid>
                  )}

                  <PaginationControl
                    currentPage={gearSetPage}
                    totalPages={gearSetTotalPages}
                    onChange={setGearSetPage}
                  />
                </Stack>
              </Paper>
            </ListPageShell>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
