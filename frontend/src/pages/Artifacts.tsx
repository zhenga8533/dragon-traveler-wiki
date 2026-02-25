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
import { Link, useNavigate } from 'react-router-dom';
import { getArtifactIcon } from '../assets/artifacts';
import EntityFilter from '../components/EntityFilter';
import FilteredListShell from '../components/layout/FilteredListShell';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import ListPageShell from '../components/layout/ListPageShell';
import QualityIcon from '../components/common/QualityIcon';
import SortableTh from '../components/common/SortableTh';
import SuggestModal, { type ArrayFieldDef, type FieldDef } from '../components/tools/SuggestModal';
import { QUALITY_ORDER } from '../constants/colors';
import { CARD_HOVER_STYLES, cardHoverHandlers } from '../constants/styles';
import { PAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { countActiveFilters, useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { Artifact } from '../types/artifact';
import { getLatestTimestamp } from '../utils';

const ARTIFACT_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Artifact name',
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: QUALITY_ORDER,
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
    placeholder: 'Artifact lore text',
  },
  {
    name: 'columns',
    label: 'Columns',
    type: 'number',
    required: true,
    placeholder: 'e.g. 2',
  },
  {
    name: 'rows',
    label: 'Rows',
    type: 'number',
    required: true,
    placeholder: 'e.g. 2',
  },
];

const ARTIFACT_EFFECT_ARRAY_FIELDS: ArrayFieldDef[] = [
  {
    name: 'effect',
    label: 'Effects',
    minItems: 1,
    fields: [
      {
        name: 'level',
        label: 'Level',
        type: 'number',
        required: true,
        placeholder: 'e.g. 0',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        placeholder: 'Effect description at this level',
      },
    ],
  },
];

interface ArtifactFilters {
  search: string;
}

const EMPTY_FILTERS: ArtifactFilters = {
  search: '',
};

export default function Artifacts() {
  const navigate = useNavigate();
  const {
    data: artifacts,
    loading,
    error,
  } = useDataFetch<Artifact[]>('data/artifacts.json', []);
  const { filters, setFilters } = useFilters<ArtifactFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.ARTIFACT_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.ARTIFACT_VIEW_MODE,
    defaultMode: 'grid',
  });
  const { sortState, handleSort } = useSortState(STORAGE_KEY.ARTIFACT_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

  const filtered = useMemo(() => {
    return artifacts
      .filter((a) => {
        if (
          filters.search &&
          !a.name.toLowerCase().includes(filters.search.toLowerCase())
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
          } else if (sortCol === 'quality') {
            cmp =
              QUALITY_ORDER.indexOf(a.quality) -
              QUALITY_ORDER.indexOf(b.quality);
          } else if (sortCol === 'size') {
            cmp = a.rows * a.columns - b.rows * b.columns;
          } else if (sortCol === 'treasures') {
            cmp = b.treasures.length - a.treasures.length;
          } else if (sortCol === 'global') {
            cmp = (b.is_global ? 1 : 0) - (a.is_global ? 1 : 0);
          }
          if (cmp !== 0) return applyDir(cmp, sortDir);
        }
        // Default: quality > name
        const qA = QUALITY_ORDER.indexOf(a.quality);
        const qB = QUALITY_ORDER.indexOf(b.quality);
        if (qA !== qB) return qA - qB;
        return a.name.localeCompare(b.name);
      });
  }, [artifacts, filters, sortCol, sortDir]);

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length, PAGE_SIZE, JSON.stringify(filters)
  );
  const pageItems = filtered.slice(offset, offset + PAGE_SIZE);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(artifacts),
    [artifacts]
  );

  const activeFilterCount = countActiveFilters(filters);

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Artifacts</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest an Artifact"
            modalTitle="Suggest a New Artifact"
            issueTitle="[Artifact] New artifact suggestion"
            fields={ARTIFACT_FIELDS}
            arrayFields={ARTIFACT_EFFECT_ARRAY_FIELDS}
          />
        </Group>

        <ListPageShell
          loading={loading}
          error={error}
          errorTitle="Could not load artifacts"
          hasData={artifacts.length > 0}
          emptyMessage="No artifact data available yet."
          skeletonCards={4}
        >
          <FilteredListShell
            count={filtered.length}
            noun="artifact"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterToggle={toggleFilter}
            filterContent={
              <EntityFilter
                groups={[]}
                selected={{}}
                onChange={() => {}}
                onClear={() => setFilters(EMPTY_FILTERS)}
                search={filters.search}
                onSearchChange={(value) =>
                  setFilters({ ...filters, search: value })
                }
                searchPlaceholder="Search artifacts..."
              />
            }
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {pageItems.map((artifact) => {
                  const iconSrc = getArtifactIcon(artifact.name);
                  return (
                    <Paper
                      key={artifact.name}
                      component={Link}
                      to={`/artifacts/${encodeURIComponent(artifact.name)}`}
                      p="md"
                      radius="md"
                      withBorder
                      style={{ ...CARD_HOVER_STYLES, textDecoration: 'none', color: 'inherit', display: 'block' }}
                      {...cardHoverHandlers}
                    >
                      <Group gap="md" align="flex-start" wrap="nowrap">
                        {iconSrc && (
                          <Image
                            src={iconSrc}
                            alt={artifact.name}
                            w={64}
                            h={64}
                            fit="contain"
                            radius="sm"
                            loading="lazy"
                          />
                        )}
                        <Stack gap={4} style={{ flex: 1 }}>
                          <Group gap="sm">
                            <QualityIcon quality={artifact.quality} />
                            <Text fw={600} size="lg" c="violet">
                              {artifact.name}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <Badge variant="light" size="sm" color="blue">
                              {artifact.rows}x{artifact.columns}
                            </Badge>
                            <GlobalBadge
                              isGlobal={artifact.is_global}
                              size="sm"
                            />
                            <Badge variant="light" size="sm" color="gray">
                              {artifact.treasures.length} treasure
                              {artifact.treasures.length !== 1 ? 's' : ''}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {artifact.lore}
                          </Text>
                        </Stack>
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            }
            tableContent={
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={{ minWidth: 600 }}>
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
                        sortKey="quality"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Quality
                      </SortableTh>
                      <SortableTh
                        sortKey="size"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Size
                      </SortableTh>
                      <SortableTh
                        sortKey="treasures"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Treasures
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
                    {pageItems.map((artifact) => {
                      const iconSrc = getArtifactIcon(artifact.name);
                      return (
                        <Table.Tr
                          key={artifact.name}
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            navigate(
                              `/artifacts/${encodeURIComponent(artifact.name)}`
                            )
                          }
                        >
                          <Table.Td>
                            {iconSrc && (
                              <Image
                                src={iconSrc}
                                alt={artifact.name}
                                w={40}
                                h={40}
                                fit="contain"
                                radius="sm"
                                loading="lazy"
                              />
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text
                              component={Link}
                              to={`/artifacts/${encodeURIComponent(artifact.name)}`}
                              size="sm"
                              fw={500}
                              c="violet"
                              style={{ textDecoration: 'none' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {artifact.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <QualityIcon quality={artifact.quality} />
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" size="sm" color="blue">
                              {artifact.rows}x{artifact.columns}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{artifact.treasures.length}</Text>
                          </Table.Td>
                          <Table.Td>
                            <GlobalBadge
                              isGlobal={artifact.is_global}
                              size="sm"
                            />
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
