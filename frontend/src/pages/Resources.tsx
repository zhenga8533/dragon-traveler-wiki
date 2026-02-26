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
import { useContext, useMemo } from 'react';
import { getResourceIcon } from '../assets/resource';
import InlineMarkup from '../components/common/InlineMarkup';
import LastUpdated from '../components/common/LastUpdated';
import PaginationControl from '../components/common/PaginationControl';
import QualityIcon from '../components/common/QualityIcon';
import SortableTh from '../components/common/SortableTh';
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import EntityFilter from '../components/common/EntityFilter';
import FilterToolbar from '../components/layout/FilterToolbar';
import ListPageShell from '../components/layout/ListPageShell';
import SuggestModal, { type FieldDef } from '../components/tools/SuggestModal';
import {
  QUALITY_ORDER,
  RESOURCE_CATEGORY_COLOR,
  RESOURCE_CATEGORY_ORDER,
} from '../constants/colors';
import { PAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { ResourcesContext } from '../contexts';
import { useFilterPanel, useFilters, useViewMode } from '../hooks';
import { usePagination } from '../hooks/use-pagination';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { ResourceCategory } from '../types/resource';
import { getLatestTimestamp } from '../utils';

const RESOURCE_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Resource name',
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: ['Currency', 'Gift', 'Item', 'Material', 'Summoning', 'Shard'],
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: QUALITY_ORDER,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the resource',
  },
];

interface ResourceFilters {
  search: string;
  categories: ResourceCategory[];
}

const EMPTY_FILTERS: ResourceFilters = {
  search: '',
  categories: [],
};

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'categories',
    label: 'Category',
    options: [...RESOURCE_CATEGORY_ORDER],
  },
];

export default function Resources() {
  const { resources, loading } = useContext(ResourcesContext);
  const { filters, setFilters } = useFilters<ResourceFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.RESOURCE_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.RESOURCE_VIEW_MODE,
    defaultMode: 'list',
  });
  const { sortState, handleSort } = useSortState(STORAGE_KEY.RESOURCE_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

  const filtered = useMemo(() => {
    return resources
      .filter((r) => {
        if (
          filters.search &&
          !r.name.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false;
        }
        if (
          filters.categories.length > 0 &&
          !filters.categories.includes(r.category)
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
            const qA = QUALITY_ORDER.indexOf(a.quality);
            const qB = QUALITY_ORDER.indexOf(b.quality);
            cmp = qA - qB;
          } else if (sortCol === 'category') {
            cmp =
              RESOURCE_CATEGORY_ORDER.indexOf(a.category) -
              RESOURCE_CATEGORY_ORDER.indexOf(b.category);
          }
          if (cmp !== 0) return applyDir(cmp, sortDir);
        }
        // Default: category > quality > name
        const catA = RESOURCE_CATEGORY_ORDER.indexOf(a.category);
        const catB = RESOURCE_CATEGORY_ORDER.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        const qA = QUALITY_ORDER.indexOf(a.quality);
        const qB = QUALITY_ORDER.indexOf(b.quality);
        if (qA !== qB) return qA - qB;
        return a.name.localeCompare(b.name);
      });
  }, [resources, filters, sortCol, sortDir]);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(resources),
    [resources]
  );

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    PAGE_SIZE,
    JSON.stringify(filters)
  );
  const pageItems = filtered.slice(offset, offset + PAGE_SIZE);

  const activeFilterCount =
    (filters.search ? 1 : 0) + filters.categories.length;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Resources</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Resource"
            modalTitle="Suggest a New Resource"
            issueTitle="[Resource] New resource suggestion"
            fields={RESOURCE_FIELDS}
          />
        </Group>

        <ListPageShell
          loading={loading}
          hasData={resources.length > 0}
          emptyMessage="No resource data available yet."
          skeletonCards={4}
        >
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <FilterToolbar
                count={filtered.length}
                noun="resource"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
              >
                <EntityFilter
                  groups={FILTER_GROUPS}
                  selected={{ categories: filters.categories }}
                  onChange={(key, values) =>
                    setFilters({
                      ...filters,
                      [key]: values as ResourceCategory[],
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
                  No resources match the current filters.
                </Text>
              ) : viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  {pageItems.map((resource) => {
                    const iconSrc = getResourceIcon(resource.name);
                    return (
                      <Paper key={resource.name} p="sm" radius="md" withBorder>
                        <Stack gap="xs">
                          <Group gap="sm" wrap="nowrap">
                            {iconSrc && (
                              <Image
                                src={iconSrc}
                                alt={resource.name}
                                w={28}
                                h={28}
                                fit="contain"
                              />
                            )}
                            <Text fw={600}>{resource.name}</Text>
                            {resource.quality && (
                              <QualityIcon quality={resource.quality} />
                            )}
                            <Badge
                              variant="light"
                              color={
                                RESOURCE_CATEGORY_COLOR[resource.category] ??
                                'gray'
                              }
                              size="sm"
                            >
                              {resource.category}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed">
                            <InlineMarkup text={resource.description} />
                          </Text>
                        </Stack>
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
                          sortKey="category"
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                        >
                          Category
                        </SortableTh>
                        <Table.Th>Description</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pageItems.map((resource) => {
                        const iconSrc = getResourceIcon(resource.name);
                        return (
                          <Table.Tr key={resource.name}>
                            <Table.Td>
                              {iconSrc && (
                                <Image
                                  src={iconSrc}
                                  alt={resource.name}
                                  w={32}
                                  h={32}
                                  fit="contain"
                                />
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text fw={600} size="sm">
                                {resource.name}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              {resource.quality && (
                                <QualityIcon quality={resource.quality} />
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                variant="light"
                                color={
                                  RESOURCE_CATEGORY_COLOR[resource.category] ??
                                  'gray'
                                }
                                size="sm"
                              >
                                {resource.category}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">
                                <InlineMarkup text={resource.description} />
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
                currentPage={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </Stack>
          </Paper>
        </ListPageShell>
      </Stack>
    </Container>
  );
}
