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
  UnstyledButton,
  Tooltip,
} from '@mantine/core';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getArtifactIcon } from '../assets/artifacts';
import { QUALITY_ICON_MAP } from '../assets/quality';
import DataFetchError from '../components/DataFetchError';
import EntityFilter from '../components/EntityFilter';
import FilterToolbar from '../components/FilterToolbar';
import LastUpdated from '../components/LastUpdated';
import { ListPageLoading } from '../components/PageLoadingSkeleton';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { QUALITY_ORDER } from '../constants/colors';
import { CARD_HOVER_STYLES, cardHoverHandlers } from '../constants/styles';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import type { Artifact } from '../types/artifact';

const ARTIFACT_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Artifact name',
  },
  {
    name: 'lore',
    label: 'Lore',
    type: 'textarea',
    required: true,
    placeholder: 'Artifact lore text',
  },
  {
    name: 'columns',
    label: 'Columns',
    type: 'text',
    required: true,
    placeholder: 'e.g. 2',
  },
  {
    name: 'rows',
    label: 'Rows',
    type: 'text',
    required: true,
    placeholder: 'e.g. 2',
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
        const qA = QUALITY_ORDER.indexOf(a.quality);
        const qB = QUALITY_ORDER.indexOf(b.quality);
        if (qA !== qB) return qA - qB;
        return a.name.localeCompare(b.name);
      });
  }, [artifacts, filters]);

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const a of artifacts) {
      if (a.last_updated > latest) latest = a.last_updated;
    }
    return latest;
  }, [artifacts]);

  const activeFilterCount = filters.search ? 1 : 0;

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
          />
        </Group>

        {loading && <ListPageLoading cards={4} />}

        {!loading && error && (
          <DataFetchError
            title="Could not load artifacts"
            message={error.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && artifacts.length === 0 && (
          <Text c="dimmed">No artifact data available yet.</Text>
        )}

        {!loading && !error && artifacts.length > 0 && (
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <FilterToolbar
                count={filtered.length}
                noun="artifact"
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
                  searchPlaceholder="Search artifacts..."
                />
              </FilterToolbar>

              {filtered.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">
                  No artifacts match the current filters.
                </Text>
              ) : viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {filtered.map((artifact) => {
                    const iconSrc = getArtifactIcon(artifact.name);
                    return (
                      <Paper
                        key={artifact.name}
                        p="md"
                        radius="md"
                        withBorder
                        style={CARD_HOVER_STYLES}
                        {...cardHoverHandlers}
                        onClick={() =>
                          navigate(
                            `/artifacts/${encodeURIComponent(artifact.name)}`
                          )
                        }
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
                            />
                          )}
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Group gap="sm">
                              <Tooltip label={artifact.quality}>
                                <Image
                                  src={QUALITY_ICON_MAP[artifact.quality]}
                                  alt={artifact.quality}
                                  h={20}
                                  w="auto"
                                  fit="contain"
                                />
                              </Tooltip>
                              <Text
                                fw={600}
                                size="lg"
                                c="violet"
                                component="a"
                                href={`#/artifacts/${encodeURIComponent(artifact.name)}`}
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(
                                    `/artifacts/${encodeURIComponent(artifact.name)}`
                                  );
                                }}
                              >
                                {artifact.name}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              <Badge variant="light" size="sm" color="blue">
                                {artifact.rows}x{artifact.columns}
                              </Badge>
                              {artifact.is_global && (
                                <Badge
                                  variant="light"
                                  size="sm"
                                  color="green"
                                >
                                  Global
                                </Badge>
                              )}
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
              ) : (
                <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                  <Table striped highlightOnHover style={{ minWidth: 600 }}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Icon</Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Quality</Table.Th>
                        <Table.Th>Size</Table.Th>
                        <Table.Th>Treasures</Table.Th>
                        <Table.Th>Global</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filtered.map((artifact) => {
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
                                />
                              )}
                            </Table.Td>
                            <Table.Td>
                              <UnstyledButton>
                                <Text size="sm" fw={500} c="violet">
                                  {artifact.name}
                                </Text>
                              </UnstyledButton>
                            </Table.Td>
                            <Table.Td>
                              <Tooltip label={artifact.quality}>
                                <Image
                                  src={QUALITY_ICON_MAP[artifact.quality]}
                                  alt={artifact.quality}
                                  h={20}
                                  w="auto"
                                  fit="contain"
                                />
                              </Tooltip>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" size="sm" color="blue">
                                {artifact.rows}x{artifact.columns}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {artifact.treasures.length}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              {artifact.is_global && (
                                <Badge
                                  variant="light"
                                  size="sm"
                                  color="green"
                                >
                                  Global
                                </Badge>
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
