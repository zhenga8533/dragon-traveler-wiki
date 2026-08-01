import {
  Badge,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { getNoblePhantasmIcon } from '@/assets';
import EntityTableLinkCell from '@/components/common/EntityTableLinkCell';
import {
  FilterMultiSelect,
  FilterSection,
} from '@/components/common/FilterControls';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import ListPageShell from '@/components/layout/ListPageShell';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import CharacterTag from '@/features/characters/components/CharacterTag';
import { getMinWidthStyle } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import SafeImage from '@/components/ui/SafeImage';
import SortableTh from '@/components/ui/SortableTh';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import PaginationControl from '@/components/ui/PaginationControl';
import { StaticSurface } from '@/components/ui/Surface';
import QualityIcon from '@/components/ui/QualityIcon';
import type { GradientPaletteAccents } from '@/contexts';
import type { useMobileTooltip } from '@/hooks';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { useNoblePhantasmUsage } from '@/features/wiki/noble-phantasms/hooks/use-noble-phantasm-usage';
import { USAGE_QUALITY_OPTIONS } from '@/features/wiki/usage/entity-usage';
import UsageCharacterPortraits from '@/features/wiki/usage/components/UsageCharacterPortraits';
import UsageFilterControls from '@/features/wiki/usage/components/UsageFilterControls';

interface NoblePhantasmUsageTabProps {
  loading: boolean;
  error: Error | null;
  noblePhantasms: NoblePhantasm[];
  usage: ReturnType<typeof useNoblePhantasmUsage>;
  accent: GradientPaletteAccents;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}

export default function NoblePhantasmUsageTab({
  loading,
  error,
  noblePhantasms,
  usage,
  accent,
  tooltipProps,
}: NoblePhantasmUsageTabProps) {
  const {
    filtered: filteredUsage,
    eligibleCharacters: usageEligibleCharacters,
    filterCount: usageFilterCount,
    filterOpen: usageFilterOpen,
    toggleFilter: onUsageFilterToggle,
    search: usageSearch,
    setSearch: onUsageSearchChange,
    resetFilters: onResetUsageFilters,
    qualityFilter: usageQualityFilter,
    setQualityFilter: onUsageQualityFilterChange,
    linkedCharacterOptions,
    linkedCharacterSlugs,
    setLinkedCharacterSlugs: onLinkedCharacterSlugsChange,
    sortCol: usageSortCol,
    sortDir: usageSortDir,
    handleSort: onUsageSort,
    pageItems: usagePageItems,
    expandedItems: expandedUsageItems,
    toggleExpandedItem: onToggleExpandedUsageItem,
    page: usagePage,
    totalPages: usageTotalPages,
    setPage: onUsagePageChange,
    pageSize: usagePageSize,
    pageSizeOptions: usagePageSizeOptions,
    setPageSize: onUsagePageSizeChange,
  } = usage;
  return (
    <ListPageShell
      loading={loading}
      error={error}
      errorTitle="Could not load noble phantasm usage"
      hasData={noblePhantasms.length > 0}
      emptyMessage="No noble phantasm data available yet."
      loadingFallback={
        <ViewModeLoading
          viewMode="list"
          listType="table"
          withToolbar
          showPagination
        />
      }
    >
      <StaticSurface p="md" data-no-hover>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Text size="sm" c="dimmed">
              {filteredUsage.length} noble phantasm
              {filteredUsage.length === 1 ? '' : 's'} · based on{' '}
              {usageEligibleCharacters.length} character
              {usageEligibleCharacters.length === 1 ? '' : 's'}
            </Text>
            <FilterPopoverButton
              filterCount={usageFilterCount}
              filterOpen={usageFilterOpen}
              onFilterToggle={onUsageFilterToggle}
            >
              <UsageFilterControls
                search={usageSearch}
                onSearchChange={onUsageSearchChange}
                searchPlaceholder="Search by noble phantasm or character..."
                filterCount={usageFilterCount}
                onReset={onResetUsageFilters}
                qualityFilter={usageQualityFilter}
                onQualityFilterChange={onUsageQualityFilterChange}
                qualityOptions={USAGE_QUALITY_OPTIONS}
                accent={accent}
              >
                <FilterSection label="Linked character">
                  <FilterMultiSelect
                    data={linkedCharacterOptions}
                    value={linkedCharacterSlugs}
                    onChange={onLinkedCharacterSlugsChange}
                    placeholder="Select linked characters"
                    searchable
                    clearable
                    size="xs"
                    style={{ flex: 1, minWidth: 220 }}
                  />
                </FilterSection>
              </UsageFilterControls>
            </FilterPopoverButton>
          </Group>

          {filteredUsage.length === 0 ? (
            <NoResultsSuggestions
              title="No noble phantasms found"
              message="No noble phantasms match the current filters."
              onReset={onResetUsageFilters}
              onOpenFilters={onUsageFilterToggle}
            />
          ) : (
            <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
              <Table striped highlightOnHover style={getMinWidthStyle(850)}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Icon</Table.Th>
                    <SortableTh
                      sortKey="name"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Name
                    </SortableTh>
                    <SortableTh
                      sortKey="character"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Character
                    </SortableTh>
                    <SortableTh
                      sortKey="rarity"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Rarity
                    </SortableTh>
                    <SortableTh
                      sortKey="count"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Characters
                    </SortableTh>
                    <Table.Th>Used By</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {usagePageItems.map(
                    ({ item, characters, count, percentage }) => {
                      const iconSrc = getNoblePhantasmIcon(item.slug);
                      const isExpanded = expandedUsageItems.has(item.slug);

                      return (
                        <Table.Tr key={item.slug}>
                          <Table.Td>
                            {iconSrc ? (
                              <SafeImage
                                src={iconSrc}
                                alt={item.name}
                                w={IMAGE_SIZE.PORTRAIT_SM}
                                h={IMAGE_SIZE.PORTRAIT_SM}
                                fit="contain"
                                loading="lazy"
                              />
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Table.Td>
                          <EntityTableLinkCell
                            to={`/noble-phantasms/${item.slug}`}
                          >
                            {item.name}
                          </EntityTableLinkCell>
                          <Table.Td>
                            {item.character_slug ? (
                              <CharacterTag
                                slug={item.character_slug}
                                size="sm"
                                color={accent.secondary}
                              />
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <QualityIcon quality={item.quality} />
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              size="sm"
                              color={accent.tertiary}
                            >
                              {count} ({percentage}%)
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {characters.length > 0 ? (
                              <UsageCharacterPortraits
                                itemSlug={item.slug}
                                characters={characters}
                                expanded={isExpanded}
                                onToggleExpanded={() =>
                                  onToggleExpandedUsageItem(item.slug)
                                }
                                tooltipProps={tooltipProps}
                              />
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    }
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}

          <PaginationControl
            currentPage={usagePage}
            totalPages={usageTotalPages}
            onChange={onUsagePageChange}
            totalItems={filteredUsage.length}
            pageSize={usagePageSize}
            pageSizeOptions={usagePageSizeOptions}
            onPageSizeChange={onUsagePageSizeChange}
          />
        </Stack>
      </StaticSurface>
    </ListPageShell>
  );
}
