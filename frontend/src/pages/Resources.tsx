import {
  Badge,
  Center,
  Container,
  Group,
  Image,
  Loader,
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
import EntityFilter from '../components/EntityFilter';
import type { ChipFilterGroup } from '../components/EntityFilter';
import FilterToolbar from '../components/FilterToolbar';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import {
  RESOURCE_CATEGORY_COLOR,
  RESOURCE_CATEGORY_ORDER,
} from '../constants/colors';
import { STORAGE_KEY } from '../constants/ui';
import { ResourcesContext } from '../contexts';
import { useFilterPanel, useFilters, useViewMode } from '../hooks/use-filters';
import type { ResourceCategory } from '../types/resource';

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
        const catA = RESOURCE_CATEGORY_ORDER.indexOf(a.category);
        const catB = RESOURCE_CATEGORY_ORDER.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return a.name.localeCompare(b.name);
      });
  }, [resources, filters]);

  const activeFilterCount =
    (filters.search ? 1 : 0) + filters.categories.length;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Resources</Title>
          <SuggestModal
            buttonLabel="Suggest a Resource"
            modalTitle="Suggest a New Resource"
            issueTitle="[Resource] New resource suggestion"
            fields={RESOURCE_FIELDS}
          />
        </Group>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && resources.length === 0 && (
          <Text c="dimmed">No resource data available yet.</Text>
        )}

        {!loading && resources.length > 0 && (
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
                  {filtered.map((resource) => {
                    const iconSrc = getResourceIcon(resource.name);
                    return (
                      <Paper
                        key={resource.name}
                        p="sm"
                        radius="md"
                        withBorder
                      >
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
                            {resource.description}
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
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Description</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filtered.map((resource) => {
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
                                {resource.description}
                              </Text>
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
