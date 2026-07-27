import {
  Badge,
  Group,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { getNoblePhantasmIcon } from '@/assets';
import EntityTableLinkCell from '@/components/common/EntityTableLinkCell';
import {
  FilterClearButton,
  FilterMultiSelect,
  FilterSearchInput,
  FilterSection,
} from '@/components/common/FilterControls';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import ListPageShell from '@/components/layout/ListPageShell';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import CharacterTag from '@/features/characters/components/CharacterTag';
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
import QualityIcon from '@/components/ui/QualityIcon';
import type { GradientPaletteAccents } from '@/contexts';
import type { useMobileTooltip } from '@/hooks';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';

export type NoblePhantasmUsageQualityFilter = 'ssr-plus' | 'ssr' | 'all';

export interface NoblePhantasmUsage {
  item: NoblePhantasm;
  characters: Character[];
  count: number;
  percentage: number;
}

interface NoblePhantasmUsageTabProps {
  loading: boolean;
  error: Error | null;
  noblePhantasms: NoblePhantasm[];
  filteredUsage: NoblePhantasmUsage[];
  usageEligibleCharacters: Character[];
  usageFilterCount: number;
  usageFilterOpen: boolean;
  onUsageFilterToggle: () => void;
  usageSearch: string;
  onUsageSearchChange: (value: string) => void;
  onResetUsageFilters: () => void;
  usageQualityFilter: NoblePhantasmUsageQualityFilter;
  onUsageQualityFilterChange: (
    value: NoblePhantasmUsageQualityFilter
  ) => void;
  usageQualityOptions: {
    value: NoblePhantasmUsageQualityFilter;
    label: string;
  }[];
  linkedCharacterOptions: { value: string; label: string }[];
  linkedCharacterSlugs: string[];
  onLinkedCharacterSlugsChange: (values: string[]) => void;
  usageSortCol: string | null;
  usageSortDir: 'asc' | 'desc';
  onUsageSort: (col: string) => void;
  usagePageItems: NoblePhantasmUsage[];
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

export default function NoblePhantasmUsageTab({
  loading,
  error,
  noblePhantasms,
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
  linkedCharacterOptions,
  linkedCharacterSlugs,
  onLinkedCharacterSlugsChange,
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
}: NoblePhantasmUsageTabProps) {
  return (
    <ListPageShell
      loading={loading}
      error={error}
      errorTitle="Could not load noble phantasm usage"
      hasData={noblePhantasms.length > 0}
      emptyMessage="No noble phantasm data available yet."
      skeletonCards={4}
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
              <Stack gap={8}>
                <Group gap="xs" align="center" wrap="wrap">
                  <FilterSearchInput
                    placeholder="Search by noble phantasm or character..."
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
                        value as NoblePhantasmUsageQualityFilter
                      )
                    }
                    data={usageQualityOptions}
                    color={accent.primary}
                    size="xs"
                  />
                </FilterSection>
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
              </Stack>
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
                      sortKey="quality"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Quality
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
                          <EntityTableLinkCell
                            to={`/noble-phantasms/${item.slug}`}
                          >
                            {item.name}
                          </EntityTableLinkCell>
                          <Table.Td>
                            {item.quality ? (
                              <QualityIcon quality={item.quality} />
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Table.Td>
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
