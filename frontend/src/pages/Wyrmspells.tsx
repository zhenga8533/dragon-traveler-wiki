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
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import EntityFilter from '../components/common/EntityFilter';
import FactionTag from '../components/common/FactionTag';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import QualityIcon from '../components/common/QualityIcon';
import { renderQualityFilterIcon } from '../components/common/renderQualityFilterIcon';
import SortableTh from '../components/common/SortableTh';
import FilteredListShell from '../components/layout/FilteredListShell';
import ListPageShell from '../components/layout/ListPageShell';
import SuggestModal, { type FieldDef } from '../components/tools/SuggestModal';
import { FACTION_NAMES, QUALITY_ORDER } from '../constants/colors';
import { getCardHoverProps, getMinWidthStyle } from '../constants/styles';
import { STORAGE_KEY } from '../constants/ui';
import { applyDir, useDataFetch, useFilteredPageData, useMobileTooltip } from '../hooks';
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
    options: FACTION_NAMES,
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
  const tooltipProps = useMobileTooltip();
  const {
    data: wyrmspells,
    loading,
    error,
  } = useDataFetch<Wyrmspell[]>('data/wyrmspells.json', []);
  const {
    filters,
    setFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    sortState,
    handleSort,
    pageItems,
    filtered,
    page,
    setPage,
    totalPages,
    activeFilterCount,
  } = useFilteredPageData(wyrmspells, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.WYRMSPELL_FILTERS,
      viewMode: STORAGE_KEY.WYRMSPELL_VIEW_MODE,
      sort: STORAGE_KEY.WYRMSPELL_SORT,
    },
    defaultViewMode: 'list',
    filterFn: (spell, filters) => {
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
    },
    sortFn: (a, b, col, dir) => {
      if (col) {
        let cmp = 0;
        if (col === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (col === 'type') {
          cmp = a.type.localeCompare(b.type);
        } else if (col === 'quality') {
          const qA = QUALITY_ORDER.indexOf(a.quality);
          const qB = QUALITY_ORDER.indexOf(b.quality);
          cmp = (qA === -1 ? 999 : qA) - (qB === -1 ? 999 : qB);
        } else if (col === 'faction') {
          const fA = a.exclusive_faction ?? '';
          const fB = b.exclusive_faction ?? '';
          // entries with no faction sort last
          if (!fA && fB) return 1;
          if (fA && !fB) return -1;
          cmp = fA.localeCompare(fB);
        } else if (col === 'global') {
          cmp = (b.is_global ? 1 : 0) - (a.is_global ? 1 : 0);
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }
      // Default: type > quality > name
      const typeCmp = a.type.localeCompare(b.type);
      if (typeCmp !== 0) return typeCmp;
      const qA = QUALITY_ORDER.indexOf(a.quality);
      const qB = QUALITY_ORDER.indexOf(b.quality);
      if (qA !== qB) return (qA === -1 ? 999 : qA) - (qB === -1 ? 999 : qB);
      return a.name.localeCompare(b.name);
    },
  });
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

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(wyrmspells),
    [wyrmspells]
  );

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
          <FilteredListShell
            count={filtered.length}
            noun="wyrmspell"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterToggle={toggleFilter}
            onResetFilters={() => setFilters(EMPTY_FILTERS)}
            filterContent={
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
            }
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {pageItems.map((spell) => {
                  const iconSrc = getWyrmspellIcon(spell.name);
                  return (
                    <Paper
                      key={spell.name}
                      p="sm"
                      radius="md"
                      withBorder
                      {...getCardHoverProps()}
                    >
                      <Group gap="md" align="flex-start" wrap="nowrap">
                        {iconSrc && (
                          <Image
                            src={iconSrc}
                            alt={spell.name}
                            w={56}
                            h={56}
                            fit="contain"
                            loading="lazy"
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
                            <GlobalBadge isGlobal={spell.is_global} size="sm" />
                            {spell.exclusive_faction && (
                              <FactionTag
                                faction={spell.exclusive_faction}
                                size="sm"
                              />
                            )}
                          </Group>
                          <Text size="sm">{spell.effect}</Text>
                        </Stack>
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            }
            tableContent={
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={getMinWidthStyle(800)}>
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
                    {pageItems.map((spell) => {
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
                                loading="lazy"
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
                              <Tooltip
                                label={spell.exclusive_faction}
                                {...tooltipProps}
                              >
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
                            <GlobalBadge isGlobal={spell.is_global} size="sm" />
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
            }
          />
        </ListPageShell>
      </Stack>
    </Container>
  );
}
