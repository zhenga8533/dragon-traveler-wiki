import ExpandableText from '@/components/ui/ExpandableText';
import SafeImage from '@/components/ui/SafeImage';
import { getArtifactIcon } from '@/assets';
import EntityFilter from '@/components/common/EntityFilter';
import EntityTableLinkCell from '@/components/common/EntityTableLinkCell';
import EntitySummaryCard from '@/components/common/EntitySummaryCard';
import FilteredListShell from '@/components/layout/FilteredListShell';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal from '@/components/tools/SuggestModal';
import RichText from '@/components/common/RichText';
import SortableTh from '@/components/ui/SortableTh';
import {
  ARTIFACT_EFFECT_ARRAY_FIELDS,
  ARTIFACT_FIELDS,
} from '@/features/wiki/artifacts/form-fields';
import { QUALITY_ORDER } from '@/constants/quality';
import {
  getMinWidthStyle,
} from '@/constants/styles';
import { IMAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import QualityIcon from '@/components/ui/QualityIcon';
import { useArtifacts, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilteredPageData,
  useGradientAccent,
} from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import {
  Badge,
  Container,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useMemo } from 'react';

interface ArtifactFilters {
  search: string;
}

const EMPTY_FILTERS: ArtifactFilters = {
  search: '',
};

export default function Artifacts() {
  const { accent } = useGradientAccent();
  const {
    data: artifacts,
    loading,
    error,
  } = useArtifacts();
  const { data: statusEffects } = useStatusEffects();
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
  } = useFilteredPageData(artifacts, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.ARTIFACT_FILTERS,
      viewMode: STORAGE_KEY.ARTIFACT_VIEW_MODE,
      sort: STORAGE_KEY.ARTIFACT_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (a, filters) => {
      if (
        filters.search &&
        !a.name.toLowerCase().includes(filters.search.toLowerCase())
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
          cmp =
            QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
        } else if (col === 'size') {
          cmp = a.rows * a.columns - b.rows * b.columns;
        } else if (col === 'treasures') {
          cmp = b.treasures.length - a.treasures.length;
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }
      // Default: quality > name
      const qA = QUALITY_ORDER.indexOf(a.quality);
      const qB = QUALITY_ORDER.indexOf(b.quality);
      if (qA !== qB) return qA - qB;
      return a.name.localeCompare(b.name);
    },
  });

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(artifacts),
    [artifacts]
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Artifacts" timestamp={mostRecentUpdate}>
          <Group gap="xs">
            <ExportButton data={artifacts} filename="artifacts.json" />
            <SuggestModal
              buttonLabel="Suggest"
              modalTitle="Suggest a New Artifact"
              issueTitle="[Artifact] New artifact suggestion"
              fields={ARTIFACT_FIELDS}
              arrayFields={ARTIFACT_EFFECT_ARRAY_FIELDS}
            />
          </Group>
        </ListPageHeader>

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
            onResetFilters={resetFilters}
            filterContent={
              <EntityFilter
                onClear={resetFilters}
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
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={setPageSize}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {pageItems.map((artifact) => {
                  const iconSrc = getArtifactIcon(artifact.slug);
                  return (
                    <EntitySummaryCard
                      key={artifact.name}
                      to={`/artifacts/${artifact.slug}`}
                      title={artifact.name}
                      imageSrc={iconSrc}
                      titleAccessory={<QualityIcon quality={artifact.quality} />}
                      metadata={
                        <Group gap="xs">
                          <Badge
                            variant="light"
                            size="sm"
                            color={accent.secondary}
                          >
                            {artifact.rows}x{artifact.columns}
                          </Badge>
                          <Badge
                            variant="light"
                            size="sm"
                            color={accent.tertiary}
                          >
                            {artifact.treasures.length} treasure
                            {artifact.treasures.length !== 1 ? 's' : ''}
                          </Badge>
                        </Group>
                      }
                      description={
                        <ExpandableText size="xs">
                          <RichText
                            text={artifact.lore}
                            statusEffects={statusEffects}
                            italic
                          />
                        </ExpandableText>
                      }
                    />
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
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageItems.map((artifact) => {
                      const iconSrc = getArtifactIcon(artifact.slug);
                      return (
                        <Table.Tr key={artifact.name}>
                          <Table.Td>
                            {iconSrc && (
                              <SafeImage
                                src={iconSrc}
                                alt={artifact.name}
                                w={IMAGE_SIZE.PORTRAIT_SM}
                                h={IMAGE_SIZE.PORTRAIT_SM}
                                fit="contain"
                                radius="sm"
                                loading="lazy"
                              />
                            )}
                          </Table.Td>
                          <EntityTableLinkCell
                            to={`/artifacts/${artifact.slug}`}
                            fontWeight={500}
                          >
                            {artifact.name}
                          </EntityTableLinkCell>
                          <Table.Td>
                            <QualityIcon quality={artifact.quality} />
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              size="sm"
                              color={accent.secondary}
                            >
                              {artifact.rows}x{artifact.columns}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{artifact.treasures.length}</Text>
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
