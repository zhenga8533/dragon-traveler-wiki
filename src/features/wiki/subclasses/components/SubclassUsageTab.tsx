import {
  Badge,
  Group,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { CLASS_ICON_MAP, getSubclassIcon } from '@/assets';
import {
  FilterChipGroup,
  FilterClearButton,
  FilterSearchInput,
  FilterSection,
} from '@/components/common/FilterControls';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import ListPageShell from '@/components/layout/ListPageShell';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import type { Character, CharacterClass } from '@/features/characters/types';
import {
  getCharacterRoutePath,
  getCharacterRouteSlug,
} from '@/features/characters/utils/character-route';
import { CURSOR_POINTER_STYLE, getMinWidthStyle } from '@/constants/styles';
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

export type SubclassUsageQualityFilter = 'ssr-plus' | 'ssr' | 'all';

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

export interface SubclassUsage {
  item: Subclass;
  characters: Character[];
  count: number;
  percentage: number;
}

interface SubclassUsageTabProps {
  loading: boolean;
  error: Error | null;
  subclasses: Subclass[];
  filteredUsage: SubclassUsage[];
  usageEligibleCharacters: Character[];
  usageFilterCount: number;
  usageFilterOpen: boolean;
  onUsageFilterToggle: () => void;
  usageSearch: string;
  onUsageSearchChange: (value: string) => void;
  onResetUsageFilters: () => void;
  usageQualityFilter: SubclassUsageQualityFilter;
  onUsageQualityFilterChange: (value: SubclassUsageQualityFilter) => void;
  usageQualityOptions: {
    value: SubclassUsageQualityFilter;
    label: string;
  }[];
  usageClasses: CharacterClass[];
  onUsageClassesChange: (values: CharacterClass[]) => void;
  usageSortCol: string | null;
  usageSortDir: 'asc' | 'desc';
  onUsageSort: (col: string) => void;
  usagePageItems: SubclassUsage[];
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

export default function SubclassUsageTab({
  loading,
  error,
  subclasses,
  filteredUsage,
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
  usageClasses,
  onUsageClassesChange,
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
}: SubclassUsageTabProps) {
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
              <Stack gap={8}>
                <Group gap="xs" align="center" wrap="wrap">
                  <FilterSearchInput
                    placeholder="Search by subclass or class..."
                    value={usageSearch}
                    onSearch={onUsageSearchChange}
                    size="xs"
                    style={{ flex: 1, minWidth: 220 }}
                  />
                  {usageFilterCount > 0 && (
                    <FilterClearButton
                      size="compact-xs"
                      onClick={onResetUsageFilters}
                    />
                  )}
                </Group>
                <FilterSection label="Character quality">
                  <SegmentedControl
                    value={usageQualityFilter}
                    onChange={(value) =>
                      onUsageQualityFilterChange(
                        value as SubclassUsageQualityFilter
                      )
                    }
                    data={usageQualityOptions}
                    color={accent.primary}
                    size="xs"
                  />
                </FilterSection>
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
              </Stack>
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
                      const shownCharacters = isExpanded
                        ? characters
                        : characters.slice(0, 6);
                      const remaining = characters.length - 6;

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
                              <Group gap={4} wrap="wrap">
                                {shownCharacters.map((character) => (
                                  <CharacterPortrait
                                    key={`${item.slug}-${getCharacterRouteSlug(character)}`}
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
                                    {isExpanded
                                      ? 'Show less'
                                      : `+${remaining} more`}
                                  </Badge>
                                )}
                              </Group>
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
