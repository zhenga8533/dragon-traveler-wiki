import SafeImage from '@/components/ui/SafeImage';
import { getWyrmPortrait } from '@/assets';
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
import ExportButton from '@/components/tools/ExportButton';
import SortableTh from '@/components/ui/SortableTh';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import {
  FACTION_NAMES,
  QUALITY_ORDER,
} from '@/constants/colors';
import {
  CURSOR_POINTER_STYLE,
  LINK_BLOCK_RESET_STYLE,
  getCardHoverProps,
  getMinWidthStyle,
} from '@/constants/styles';
import { STORAGE_KEY } from '@/constants/ui';
import type { WyrmPhase } from '@/features/wiki/wyrms/types';
import { WYRM_PHASE_ORDER } from '@/features/wiki/wyrms/types';
import { useStatusEffects, useWyrms } from '@/features/wiki/hooks/use-wiki-data';
import { applyDir, useFilteredPageData } from '@/hooks';
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

const WYRM_PHASE_COLOR: Record<WyrmPhase, string> = {
  'Juvenile Phase': 'violet',
  'Growth Phase': 'yellow',
  'Final Phase': 'orange',
};

interface WyrmFilters {
  search: string;
  phases: string[];
  qualities: string[];
  factions: string[];
}

const EMPTY_FILTERS: WyrmFilters = {
  search: '',
  phases: [],
  qualities: [],
  factions: [],
};

function phaseIndex(phase: WyrmPhase): number {
  return WYRM_PHASE_ORDER.indexOf(phase);
}

export default function WyrmsListPage() {
  const navigate = useNavigate();
  const { data: statusEffects } = useStatusEffects();
  const { data: wyrms, loading, error } = useWyrms();

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
  } = useFilteredPageData(wyrms, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.WYRM_FILTERS,
      viewMode: STORAGE_KEY.WYRM_VIEW_MODE,
      sort: STORAGE_KEY.WYRM_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (wyrm, f) => {
      if (f.search && !wyrm.name.toLowerCase().includes(f.search.toLowerCase()))
        return false;
      if (f.phases.length > 0 && !f.phases.includes(wyrm.phase)) return false;
      if (f.qualities.length > 0 && !f.qualities.includes(wyrm.quality))
        return false;
      if (f.factions.length > 0 && !f.factions.includes(wyrm.faction))
        return false;
      return true;
    },
    sortFn: (a, b, col, dir) => {
      if (col) {
        let cmp = 0;
        if (col === 'name') cmp = a.name.localeCompare(b.name);
        else if (col === 'phase') cmp = phaseIndex(a.phase) - phaseIndex(b.phase);
        else if (col === 'quality')
          cmp = QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
        else if (col === 'faction') cmp = a.faction.localeCompare(b.faction);
        if (cmp !== 0) return applyDir(cmp, dir);
      }
      // Default: faction → phase → name
      const fCmp = a.faction.localeCompare(b.faction);
      if (fCmp !== 0) return fCmp;
      const pCmp = phaseIndex(a.phase) - phaseIndex(b.phase);
      if (pCmp !== 0) return pCmp;
      return a.name.localeCompare(b.name);
    },
  });

  const phaseOptions = useMemo(() => {
    const phases = new Set(wyrms.map((w) => w.phase));
    return WYRM_PHASE_ORDER.filter((p) => phases.has(p));
  }, [wyrms]);

  const qualityOptions = useMemo(
    () => orderFilterOptions(wyrms.map((w) => w.quality), QUALITY_ORDER),
    [wyrms]
  );

  const factionOptions = useMemo(() => {
    const factions = new Set(wyrms.map((w) => w.faction));
    return FACTION_NAMES.filter((f) => factions.has(f));
  }, [wyrms]);

  const filterGroups: ChipFilterGroup[] = useMemo(() => {
    const groups: ChipFilterGroup[] = [];
    if (phaseOptions.length > 0)
      groups.push({ key: 'phases', label: 'Phase', options: phaseOptions });
    if (qualityOptions.length > 0)
      groups.push(createQualityFilterGroup({ label: 'Quality', options: qualityOptions }));
    if (factionOptions.length > 0)
      groups.push({ key: 'factions', label: 'Faction', options: factionOptions });
    return groups;
  }, [phaseOptions, qualityOptions, factionOptions]);

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(wyrms), [wyrms]);

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Wyrms" timestamp={mostRecentUpdate}>
          <ExportButton data={wyrms} filename="wyrms.json" />
        </ListPageHeader>

        <ListPageShell
          loading={loading}
          error={error}
          errorTitle="Could not load wyrms"
          hasData={wyrms.length > 0}
          emptyMessage="No wyrm data available yet."
          skeletonCards={6}
        >
          <FilteredListShell
            count={filtered.length}
            noun="wyrm"
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
                  phases: filters.phases,
                  qualities: filters.qualities,
                  factions: filters.factions,
                }}
                onChange={(key, values) => setFilters({ ...filters, [key]: values })}
                onClear={resetFilters}
                search={filters.search}
                onSearchChange={(value) => setFilters({ ...filters, search: value })}
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
                {pageItems.map((wyrm) => {
                  const iconSrc = getWyrmPortrait(wyrm.name);
                  const phaseColor = WYRM_PHASE_COLOR[wyrm.phase];
                  return (
                    <Paper
                      key={wyrm.name}
                      component={Link}
                      to={`/wyrms/${toEntitySlug(wyrm.name)}`}
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
                            alt={wyrm.name}
                            w={56}
                            h={56}
                            fit="contain"
                            loading="lazy"
                          />
                        )}
                        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="sm" wrap="wrap">
                            <Text fw={600} className="dt-link-text">
                              {wyrm.name}
                            </Text>
                            <QualityIcon quality={wyrm.quality} />
                          </Group>
                          <Group gap="xs" wrap="wrap">
                            <Badge variant="light" size="sm" color={phaseColor}>
                              {wyrm.phase}
                            </Badge>
                            <FactionTag faction={wyrm.faction} size="sm" />
                          </Group>
                          <RichText
                            text={wyrm.battle_description}
                            statusEffects={statusEffects}
                          />
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
                      <SortableTh sortKey="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                        Name
                      </SortableTh>
                      <SortableTh sortKey="phase" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                        Phase
                      </SortableTh>
                      <SortableTh sortKey="quality" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                        Quality
                      </SortableTh>
                      <SortableTh sortKey="faction" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                        Faction
                      </SortableTh>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageItems.map((wyrm) => {
                      const iconSrc = getWyrmPortrait(wyrm.name);
                      const phaseColor = WYRM_PHASE_COLOR[wyrm.phase];
                      return (
                        <Table.Tr
                          key={wyrm.name}
                          style={CURSOR_POINTER_STYLE}
                          onClick={() => navigate(`/wyrms/${toEntitySlug(wyrm.name)}`)}
                        >
                          <Table.Td>
                            {iconSrc && (
                              <SafeImage
                                src={iconSrc}
                                alt={wyrm.name}
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
                              to={`/wyrms/${toEntitySlug(wyrm.name)}`}
                              fw={600}
                              size="sm"
                              className="dt-link-text"
                              style={{ textDecoration: 'none' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {wyrm.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" size="sm" color={phaseColor}>
                              {wyrm.phase}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <QualityIcon quality={wyrm.quality} />
                          </Table.Td>
                          <Table.Td>
                            <FactionTag faction={wyrm.faction} size="sm" />
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
