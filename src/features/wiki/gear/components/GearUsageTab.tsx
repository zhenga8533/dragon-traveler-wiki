import { Badge, Group, ScrollArea, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { getGearIcon } from '@/assets';
import EntityTableLinkCell from '@/components/common/EntityTableLinkCell';
import {
  FilterClearButton,
  FilterSearchInput,
  FilterSection,
} from '@/components/common/FilterControls';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import ListPageShell from '@/components/layout/ListPageShell';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import type { Character } from '@/features/characters/types';
import {
  getCharacterRoutePath,
  getCharacterRouteSlug,
} from '@/features/characters/utils/character-route';
import { CURSOR_POINTER_STYLE, getMinWidthStyle } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import SafeImage from '@/components/ui/SafeImage';
import SortableTh from '@/components/ui/SortableTh';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import PaginationControl from '@/components/ui/PaginationControl';
import { StaticSurface } from '@/components/ui/Surface';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import type { Gear, GearSet } from '@/features/wiki/gear/types';
import type { GradientPaletteAccents } from '@/contexts';
import type { useMobileTooltip } from '@/hooks';

export type UsageQualityFilter = 'ssr-plus' | 'ssr' | 'all';

export interface GearItemUsage {
  item: Gear;
  characters: Character[];
  count: number;
  percentage: number;
}

interface GearUsageTabProps {
  loading: boolean;
  error: Error | null;
  gearSets: GearSet[];
  filteredGearItemUsage: GearItemUsage[];
  usageEligibleCharacters: Character[];
  usageFilterCount: number;
  usageFilterOpen: boolean;
  onUsageFilterToggle: () => void;
  usageSearch: string;
  onUsageSearchChange: (value: string) => void;
  onResetUsageFilters: () => void;
  usageQualityFilter: UsageQualityFilter;
  onUsageQualityFilterChange: (value: UsageQualityFilter) => void;
  usageQualityOptions: { value: UsageQualityFilter; label: string }[];
  usageSortCol: string | null;
  usageSortDir: 'asc' | 'desc';
  onUsageSort: (col: string) => void;
  usagePageItems: GearItemUsage[];
  expandedUsageItems: Set<string>;
  onToggleExpandedUsageItem: (slug: string) => void;
  usagePage: number;
  usageTotalPages: number;
  onUsagePageChange: (page: number) => void;
  usagePageSize: number;
  usagePageSizeOptions: readonly number[];
  onUsagePageSizeChange: (pageSize: number) => void;
  accent: GradientPaletteAccents;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}

export default function GearUsageTab({
  loading,
  error,
  gearSets,
  filteredGearItemUsage,
  usageEligibleCharacters,
  usageFilterCount,
  usageFilterOpen,
  onUsageFilterToggle,
  usageSearch,
  onUsageSearchChange,
  onResetUsageFilters,
  usageQualityFilter,
  onUsageQualityFilterChange,
  usageQualityOptions,
  usageSortCol,
  usageSortDir,
  onUsageSort,
  usagePageItems,
  expandedUsageItems,
  onToggleExpandedUsageItem,
  usagePage,
  usageTotalPages,
  onUsagePageChange,
  usagePageSize,
  usagePageSizeOptions,
  onUsagePageSizeChange,
  accent,
  tooltipProps,
}: GearUsageTabProps) {
  return (
    <ListPageShell
      loading={loading}
      error={error}
      errorTitle="Could not load gear usage"
      hasData={gearSets.length > 0}
      emptyMessage="No gear set data available yet."
      skeletonCards={4}
    >
      <StaticSurface p="md" data-no-hover>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Text size="sm" c="dimmed">
              {filteredGearItemUsage.length} gear item
              {filteredGearItemUsage.length !== 1 ? 's' : ''} · based on{' '}
              {usageEligibleCharacters.length} character
              {usageEligibleCharacters.length === 1 ? '' : 's'}
            </Text>
            <FilterPopoverButton
              filterCount={usageFilterCount}
              filterOpen={usageFilterOpen}
              onFilterToggle={onUsageFilterToggle}
            >
              <Stack gap={8}>
                <Group gap="xs" align="center" wrap="wrap">
                  <FilterSearchInput
                    placeholder="Search by gear or set..."
                    value={usageSearch}
                    onSearch={onUsageSearchChange}
                    size="xs"
                    style={{ flex: 1, minWidth: 180 }}
                  />
                  {usageFilterCount > 0 && (
                    <FilterClearButton
                      size="compact-xs"
                      onClick={onResetUsageFilters}
                    />
                  )}
                </Group>
                <FilterSection label="Quality">
                  <SegmentedControl
                    value={usageQualityFilter}
                    onChange={(value) =>
                      onUsageQualityFilterChange(value as UsageQualityFilter)
                    }
                    data={usageQualityOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    color={accent.primary}
                    size="xs"
                  />
                </FilterSection>
              </Stack>
            </FilterPopoverButton>
          </Group>

          {filteredGearItemUsage.length === 0 ? (
            <NoResultsSuggestions
              title="No gear found"
              message="No gear matches the current filters."
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
                      sortKey="type"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Type
                    </SortableTh>
                    <SortableTh
                      sortKey="set"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Set
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
                    ({ item, characters: usingCharacters, count, percentage }) => {
                      const iconSrc = getGearIcon(item.type, item.slug);
                      return (
                        <Table.Tr key={item.name}>
                          <Table.Td>
                            {iconSrc && (
                              <SafeImage
                                src={iconSrc}
                                alt={item.name}
                                w={IMAGE_SIZE.PORTRAIT_SM}
                                h={IMAGE_SIZE.PORTRAIT_SM}
                                fit="contain"
                                loading="lazy"
                              />
                            )}
                          </Table.Td>
                          <EntityTableLinkCell to={`/gear-sets/${item.set}`}>
                            {item.name}
                          </EntityTableLinkCell>
                          <Table.Td>
                            <GearTypeTag type={item.type} />
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" size="sm" color={accent.secondary}>
                              {item.set}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" size="sm" color={accent.tertiary}>
                              {count} ({percentage}%)
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {usingCharacters.length > 0 ? (
                              (() => {
                                const isExpanded = expandedUsageItems.has(item.slug);
                                const shown = isExpanded
                                  ? usingCharacters
                                  : usingCharacters.slice(0, 6);
                                const remaining = usingCharacters.length - 6;
                                return (
                                  <Group gap={4} wrap="wrap">
                                    {shown.map((character) => (
                                      <CharacterPortrait
                                        key={`${item.name}-${character.name}-${character.quality}`}
                                        name={character.name}
                                        size={32}
                                        quality={character.quality}
                                        assetKey={getCharacterRouteSlug(character)}
                                        routePath={getCharacterRoutePath(character)}
                                        link
                                        tooltip={character.name}
                                        tooltipProps={tooltipProps}
                                      />
                                    ))}
                                    {remaining > 0 && (
                                      <Badge
                                        variant="light"
                                        color="gray"
                                        size="sm"
                                        style={CURSOR_POINTER_STYLE}
                                        onClick={() =>
                                          onToggleExpandedUsageItem(item.slug)
                                        }
                                      >
                                        {isExpanded ? 'Show less' : `+${remaining} more`}
                                      </Badge>
                                    )}
                                  </Group>
                                );
                              })()
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
            totalItems={filteredGearItemUsage.length}
            pageSize={usagePageSize}
            pageSizeOptions={usagePageSizeOptions}
            onPageSizeChange={onUsagePageSizeChange}
          />
        </Stack>
      </StaticSurface>
    </ListPageShell>
  );
}
