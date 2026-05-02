import SafeImage from '@/components/ui/SafeImage';
import { getWyrmspellIcon } from '@/assets';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import {
  createQualityFilterGroup,
  orderFilterOptions,
} from '@/components/common/EntityFilterGroups';
import RichText from '@/components/common/RichText';
import FilteredListShell from '@/components/layout/FilteredListShell';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import SuggestModal, { type FieldDef } from '@/components/tools/SuggestModal';
import SortableTh from '@/components/ui/SortableTh';
import {
  FACTION_NAMES,
  QUALITY_ORDER,
  WYRMSPELL_TYPE_COLOR,
  getStableTagColor,
} from '@/constants/colors';
import {
  CURSOR_POINTER_STYLE,
  LINK_BLOCK_RESET_STYLE,
  getCardHoverProps,
  getMinWidthStyle,
} from '@/constants/styles';
import { STORAGE_KEY } from '@/constants/ui';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import GlobalBadge from '@/components/ui/GlobalBadge';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { getMaxQuality } from '@/features/wiki/wyrmspells/types';
import { useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import { applyDir, useDataFetch, useFilteredPageData, useGradientAccent } from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import { toEntitySlug } from '@/utils/entity-slug';
import {
  Badge,
  Container,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const WYRMSPELL_TYPE_FILTER_ORDER = [
  'Breach',
  'Refuge',
  'Wildcry',
  "Dragon's Call",
] as const;

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
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const { data: statusEffects } = useStatusEffects();
  const {
    data: wyrmspells,
    loading,
    error,
  } = useDataFetch<Wyrmspell[]>('data/wyrmspells.json', []);
  const {
    filters,
    setFilters,
    resetFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    sortCol,
    sortDir,
    handleSort,
    pageItems,
    filtered,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    pageSizeOptions,
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
      if (filters.qualities.length > 0) {
        const maxQ = getMaxQuality(spell)?.quality;
        if (!maxQ || !filters.qualities.includes(maxQ)) return false;
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
          const mA = getMaxQuality(a)?.quality;
          const mB = getMaxQuality(b)?.quality;
          const qA = mA !== undefined ? QUALITY_ORDER.indexOf(mA) : -1;
          const qB = mB !== undefined ? QUALITY_ORDER.indexOf(mB) : -1;
          cmp = (qA === -1 ? 999 : qA) - (qB === -1 ? 999 : qB);
        } else if (col === 'faction') {
          const fA = a.exclusive_faction ?? '';
          const fB = b.exclusive_faction ?? '';
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
      const dA = getMaxQuality(a)?.quality;
      const dB = getMaxQuality(b)?.quality;
      const qA = dA !== undefined ? QUALITY_ORDER.indexOf(dA) : -1;
      const qB = dB !== undefined ? QUALITY_ORDER.indexOf(dB) : -1;
      if (qA !== qB) return (qA === -1 ? 999 : qA) - (qB === -1 ? 999 : qB);
      return a.name.localeCompare(b.name);
    },
  });

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const spell of wyrmspells) {
      if (spell.type) types.add(spell.type);
    }
    const preferred = WYRMSPELL_TYPE_FILTER_ORDER.filter((type) =>
      types.has(type)
    );
    const extras = [...types]
      .filter((type) => !WYRMSPELL_TYPE_FILTER_ORDER.includes(type as never))
      .sort();
    return [...preferred, ...extras];
  }, [wyrmspells]);

  const qualityOptions = useMemo(() => {
    return orderFilterOptions(
      wyrmspells.flatMap((spell) => {
        const q = getMaxQuality(spell)?.quality;
        return q ? [q] : [];
      }),
      QUALITY_ORDER
    );
  }, [wyrmspells]);

  const filterGroups: ChipFilterGroup[] = useMemo(() => {
    const groups: ChipFilterGroup[] = [];
    if (typeOptions.length > 0)
      groups.push({ key: 'types', label: 'Type', options: typeOptions });
    if (qualityOptions.length > 0)
      groups.push(
        createQualityFilterGroup({
          label: 'Max Quality',
          options: qualityOptions,
        })
      );
    return groups;
  }, [typeOptions, qualityOptions]);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(wyrmspells),
    [wyrmspells]
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Wyrmspells" timestamp={mostRecentUpdate}>
          <SuggestModal
            buttonLabel="Suggest a Wyrmspell"
            modalTitle="Suggest a New Wyrmspell"
            issueTitle="[Wyrmspell] New wyrmspell suggestion"
            fields={WYRMSPELL_FIELDS}
          />
        </ListPageHeader>

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
            onResetFilters={resetFilters}
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
                onClear={resetFilters}
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
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={setPageSize}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {pageItems.map((spell) => {
                  const iconSrc = getWyrmspellIcon(spell.name);
                  const maxQuality = getMaxQuality(spell);
                  return (
                    <Paper
                      key={spell.name}
                      component={Link}
                      to={`/wyrmspells/${toEntitySlug(spell.name)}`}
                      p="sm"
                      radius="md"
                      withBorder
                      {...getCardHoverProps({
                        interactive: true,
                        style: LINK_BLOCK_RESET_STYLE,
                      })}
                    >
                      <Group gap="md" align="flex-start" wrap="nowrap">
                        {iconSrc && (
                          <SafeImage
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
                            <Text fw={600} c={`${accent.primary}.7`}>
                              {spell.name}
                            </Text>
                            {maxQuality && (
                              <QualityIcon quality={maxQuality.quality} />
                            )}
                          </Group>
                          <Group gap="sm" wrap="wrap">
                            <Badge
                              variant="light"
                              size="sm"
                              color={
                                WYRMSPELL_TYPE_COLOR[spell.type] ??
                                getStableTagColor(spell.type)
                              }
                            >
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
                          {maxQuality && (
                            <RichText
                              text={maxQuality.effect}
                              statusEffects={statusEffects}
                            />
                          )}
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
                      const maxQuality = getMaxQuality(spell);
                      return (
                        <Table.Tr
                          key={spell.name}
                          style={CURSOR_POINTER_STYLE}
                          onClick={() =>
                            navigate(`/wyrmspells/${toEntitySlug(spell.name)}`)
                          }
                        >
                          <Table.Td>
                            {iconSrc && (
                              <SafeImage
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
                            <Text
                              component={Link}
                              to={`/wyrmspells/${toEntitySlug(spell.name)}`}
                              fw={600}
                              size="sm"
                              c={`${accent.primary}.7`}
                              style={{ textDecoration: 'none' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {spell.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              size="sm"
                              color={
                                WYRMSPELL_TYPE_COLOR[spell.type] ??
                                getStableTagColor(spell.type)
                              }
                            >
                              {spell.type}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {maxQuality && (
                              <QualityIcon quality={maxQuality.quality} />
                            )}
                          </Table.Td>
                          <Table.Td>
                            {spell.exclusive_faction ? (
                              <FactionTag
                                faction={spell.exclusive_faction}
                                size="sm"
                              />
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
                            {maxQuality && (
                              <RichText
                                text={maxQuality.effect}
                                statusEffects={statusEffects}
                              />
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
