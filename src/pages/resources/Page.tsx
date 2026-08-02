import SafeImage from '@/components/ui/SafeImage';
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
import { useContext, useMemo } from 'react';
import { getResourceIcon } from '@/assets';
import {
  EntityFilter,
  FilteredListShell,
  InlineMarkup,
  ListPageHeader,
  ListPageShell,
  QualityIcon,
  SortableTh,
  SuggestModal,
  type ChipFilterGroup,
  type FieldDef,
} from '@/components';
import ExportButton from '@/components/tools/ExportButton';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import { QUALITY_ORDER } from '@/constants/quality';
import { RESOURCE_CATEGORY_COLOR, RESOURCE_CATEGORY_ORDER } from '@/constants/resource-colors';
import { getCardHoverProps, getMinWidthStyle } from '@/constants/styles';
import { STORAGE_KEY } from '@/constants/ui';
import { ResourcesContext } from '@/contexts';
import { applyDir, useFilteredPageData, useSearchParamFilter } from '@/hooks';
import type { ResourceCategory } from '@/types/resource';
import type { Quality } from '@/types/quality';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import { getLatestTimestamp } from '@/utils';
import { compareQuality } from '@/utils/quality';

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
    options: [...RESOURCE_CATEGORY_ORDER],
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
  qualities: Quality[];
}

const EMPTY_FILTERS: ResourceFilters = {
  search: '',
  categories: [],
  qualities: [],
};

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'categories',
    label: 'Category',
    options: [...RESOURCE_CATEGORY_ORDER],
  },
  createQualityFilterGroup(),
];

export default function Resources() {
  const { resources, loading, error, retry } = useContext(ResourcesContext);
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
  } = useFilteredPageData(resources, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.RESOURCE_FILTERS,
      viewMode: STORAGE_KEY.RESOURCE_VIEW_MODE,
      sort: STORAGE_KEY.RESOURCE_SORT,
    },
    defaultViewMode: 'list',
    filterFn: (r, filters) => {
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
      if (
        filters.qualities.length > 0 &&
        !filters.qualities.includes(r.quality)
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
        } else if (col === 'quality') {
          cmp = compareQuality(a.quality, b.quality);
        } else if (col === 'category') {
          cmp =
            RESOURCE_CATEGORY_ORDER.indexOf(a.category) -
            RESOURCE_CATEGORY_ORDER.indexOf(b.category);
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }
      // Default: category > quality > name
      const catA = RESOURCE_CATEGORY_ORDER.indexOf(a.category);
      const catB = RESOURCE_CATEGORY_ORDER.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      const qualityComparison = compareQuality(a.quality, b.quality);
      if (qualityComparison !== 0) return qualityComparison;
      return a.name.localeCompare(b.name);
    },
  });
  useSearchParamFilter(setFilters);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(resources),
    [resources]
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Resources" timestamp={mostRecentUpdate}>
          <Group gap="xs">
            <ExportButton data={resources} filename="resources.json" />
            <SuggestModal
              buttonLabel="Suggest"
              modalTitle="Suggest a New Resource"
              issueTitle="[Resource] New resource suggestion"
              fields={RESOURCE_FIELDS}
            />
          </Group>
        </ListPageHeader>

        <ListPageShell
          loading={loading}
          error={error}
          onRetry={retry}
          errorTitle="Could not load resources"
          hasData={resources.length > 0}
          emptyMessage="No resource data available yet."
          loadingFallback={
            <ViewModeLoading
              viewMode={viewMode}
              listType="table"
              withToolbar
              showPagination
            />
          }
        >
          <FilteredListShell
            count={filtered.length}
            noun="resource"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterToggle={toggleFilter}
            onResetFilters={resetFilters}
            filterContent={
              <EntityFilter
                groups={FILTER_GROUPS}
                selected={{
                  categories: filters.categories,
                  qualities: filters.qualities,
                }}
                onChange={(key, values) => {
                  if (key === 'categories') {
                    setFilters({
                      ...filters,
                      categories: values as ResourceCategory[],
                    });
                    return;
                  }
                  setFilters({ ...filters, qualities: values as Quality[] });
                }}
                onClear={resetFilters}
                search={filters.search}
                onSearchChange={(value) =>
                  setFilters({ ...filters, search: value })
                }
                searchPlaceholder="Search by name..."
              />
            }
            emptyMessage="No resources match the current filters."
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={setPageSize}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {pageItems.map((resource) => {
                  const iconSrc = getResourceIcon(resource.slug, resource.category);
                  return (
                    <Paper
                      key={resource.name}
                      p="sm"
                      radius="md"
                      withBorder
                      {...getCardHoverProps()}
                    >
                      <Stack gap="xs">
                        <Group gap="sm" wrap="nowrap">
                          {iconSrc && (
                            <SafeImage
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
            }
            tableContent={
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={getMinWidthStyle(600)}>
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
                      const iconSrc = getResourceIcon(resource.slug, resource.category);
                      return (
                        <Table.Tr key={resource.name}>
                          <Table.Td>
                            {iconSrc && (
                              <SafeImage
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
            }
          />
        </ListPageShell>
      </Stack>
    </Container>
  );
}
