import {
  Badge,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { CLASS_ICON_MAP, getSubclassIcon } from '@/assets';
import {
  FilterChipGroup,
  FilterSection,
} from '@/components/common/FilterControls';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import ListPageShell from '@/components/layout/ListPageShell';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import type { CharacterClass } from '@/features/characters/types';
import { getMinWidthStyle } from '@/constants/styles';
import { CLASS_ORDER } from '@/constants/class-colors';
import { IMAGE_SIZE } from '@/constants/ui';
import SafeImage from '@/components/ui/SafeImage';
import SortableTh from '@/components/ui/SortableTh';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import PaginationControl from '@/components/ui/PaginationControl';
import { StaticSurface } from '@/components/ui/Surface';
import ClassTag from '@/components/ui/ClassTag';
import TierBadge from '@/components/ui/TierBadge';
import type { GradientPaletteAccents } from '@/contexts';
import type { useMobileTooltip } from '@/hooks';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { useSubclassUsage } from '@/features/wiki/subclasses/hooks/use-subclass-usage';
import { USAGE_QUALITY_OPTIONS } from '@/features/wiki/usage/entity-usage';
import UsageCharacterPortraits from '@/features/wiki/usage/components/UsageCharacterPortraits';
import UsageFilterControls from '@/features/wiki/usage/components/UsageFilterControls';

const USAGE_CLASS_OPTIONS = CLASS_ORDER.map((characterClass) => ({
  value: characterClass,
  label: (
    <Group gap={4} wrap="nowrap" align="center">
      <SafeImage
        src={CLASS_ICON_MAP[characterClass]}
        alt={characterClass}
        w={IMAGE_SIZE.ICON_SM}
        h={IMAGE_SIZE.ICON_SM}
        fit="contain"
      />
      <span>
        {characterClass.charAt(0).toUpperCase() + characterClass.slice(1)}
      </span>
    </Group>
  ),
}));

interface SubclassUsageTabProps {
  loading: boolean;
  error: Error | null;
  subclasses: Subclass[];
  usage: ReturnType<typeof useSubclassUsage>;
  accent: GradientPaletteAccents;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}

export default function SubclassUsageTab({
  loading,
  error,
  subclasses,
  usage,
  accent,
  tooltipProps,
}: SubclassUsageTabProps) {
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
    classes: usageClasses,
    setClasses: onUsageClassesChange,
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
      errorTitle="Could not load subclass usage"
      hasData={subclasses.length > 0}
      emptyMessage="No subclass data available yet."
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
              {filteredUsage.length} subclass
              {filteredUsage.length === 1 ? '' : 'es'} · based on{' '}
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
                searchPlaceholder="Search by subclass or class..."
                filterCount={usageFilterCount}
                onReset={onResetUsageFilters}
                qualityFilter={usageQualityFilter}
                onQualityFilterChange={onUsageQualityFilterChange}
                qualityOptions={USAGE_QUALITY_OPTIONS}
                accent={accent}
              >
                <FilterSection label="Subclass class">
                  <FilterChipGroup
                    options={USAGE_CLASS_OPTIONS}
                    value={usageClasses}
                    onChange={(values) =>
                      onUsageClassesChange(values as CharacterClass[])
                    }
                    size="xs"
                  />
                </FilterSection>
              </UsageFilterControls>
            </FilterPopoverButton>
          </Group>

          {filteredUsage.length === 0 ? (
            <NoResultsSuggestions
              title="No subclasses found"
              message="No subclasses match the current filters."
              onReset={onResetUsageFilters}
              onOpenFilters={onUsageFilterToggle}
            />
          ) : (
            <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
              <Table striped highlightOnHover style={getMinWidthStyle(800)}>
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
                      sortKey="class"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Class
                    </SortableTh>
                    <SortableTh
                      sortKey="tier"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Tier
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
                      const iconSrc = getSubclassIcon(item.slug, item.class);
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
                          <Table.Td>
                            <Text fw={600} size="sm">
                              {item.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <ClassTag characterClass={item.class} size="sm" />
                          </Table.Td>
                          <Table.Td>
                            <TierBadge
                              tier={String(item.tier)}
                              showPrefix
                              size="sm"
                              index={item.tier - 1}
                            />
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
