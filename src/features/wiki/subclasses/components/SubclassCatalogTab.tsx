import {
  Badge,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { getSubclassIcon } from '@/assets';
import EntityFilter from '@/components/common/EntityFilter';
import FilteredListShell from '@/components/layout/FilteredListShell';
import ListPageShell from '@/components/layout/ListPageShell';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import RichText from '@/components/common/RichText';
import ClassTag from '@/components/ui/ClassTag';
import SafeImage from '@/components/ui/SafeImage';
import SortableTh from '@/components/ui/SortableTh';
import TierBadge from '@/components/ui/TierBadge';
import { StaticSurface } from '@/components/ui/Surface';
import { getMinWidthStyle } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import type { GradientPaletteAccents } from '@/contexts';
import type { CharacterClass } from '@/features/characters/types';
import { SUBCLASS_FILTER_GROUPS } from '@/features/wiki/subclasses/filters';
import type { useSubclassCatalog } from '@/features/wiki/subclasses/hooks/use-subclass-catalog';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';

interface SubclassCatalogTabProps {
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  subclasses: Subclass[];
  statusEffects: StatusEffect[];
  accent: GradientPaletteAccents;
  catalog: ReturnType<typeof useSubclassCatalog>;
}

export default function SubclassCatalogTab({
  loading,
  error,
  onRetry,
  subclasses,
  statusEffects,
  accent,
  catalog,
}: SubclassCatalogTabProps) {
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
  } = catalog;

  const filterContent = (
    <EntityFilter
      groups={SUBCLASS_FILTER_GROUPS}
      selected={{ classes: filters.classes, tiers: filters.tiers }}
      onChange={(key, values) => {
        if (key === 'classes') {
          setFilters({ ...filters, classes: values as CharacterClass[] });
          return;
        }
        setFilters({ ...filters, tiers: values });
      }}
      onClear={resetFilters}
      search={filters.search}
      onSearchChange={(search) => setFilters({ ...filters, search })}
      searchPlaceholder="Search by name..."
    />
  );

  return (
    <ListPageShell
      loading={loading}
      error={error}
      onRetry={onRetry}
      errorTitle="Could not load subclasses"
      hasData={subclasses.length > 0}
      emptyMessage="No subclass data available yet."
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
        noun="subclass"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterCount={activeFilterCount}
        filterOpen={filterOpen}
        onFilterToggle={toggleFilter}
        onResetFilters={resetFilters}
        filterContent={filterContent}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={setPageSize}
        gridContent={
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {pageItems.map((item) => {
              const icon = getSubclassIcon(item.slug, item.class);
              return (
                <StaticSurface
                  key={item.slug}
                  p="sm"
                >
                  <Stack gap="xs">
                    <Group gap="sm" wrap="nowrap">
                      {icon && (
                        <SafeImage
                          src={icon}
                          alt={item.name}
                          w={IMAGE_SIZE.CARD_ICON_SM}
                          h={IMAGE_SIZE.CARD_ICON_SM}
                          fit="contain"
                          loading="lazy"
                        />
                      )}
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600}>{item.name}</Text>
                        <Group gap="xs" wrap="wrap">
                          <ClassTag characterClass={item.class} size="xs" />
                          <TierBadge
                            tier={String(item.tier)}
                            showPrefix
                            size="xs"
                            index={item.tier - 1}
                          />
                        </Group>
                      </Stack>
                    </Group>
                    {item.bonuses.length > 0 && (
                      <Group gap="xs" wrap="wrap">
                        {item.bonuses.map((bonus) => (
                          <Badge
                            key={bonus}
                            variant="outline"
                            size="xs"
                            color={accent.secondary}
                          >
                            {bonus}
                          </Badge>
                        ))}
                      </Group>
                    )}
                    <RichText text={item.effect} statusEffects={statusEffects} />
                  </Stack>
                </StaticSurface>
              );
            })}
          </SimpleGrid>
        }
        tableContent={
          <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
            <Table striped highlightOnHover style={getMinWidthStyle(860)}>
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
                    sortKey="class"
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                  >
                    Class
                  </SortableTh>
                  <SortableTh
                    sortKey="tier"
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                  >
                    Tier
                  </SortableTh>
                  <Table.Th>Bonuses</Table.Th>
                  <Table.Th>Effect</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageItems.map((item) => {
                  const icon = getSubclassIcon(item.slug, item.class);
                  return (
                    <Table.Tr key={item.slug}>
                      <Table.Td>
                        {icon && (
                          <SafeImage
                            src={icon}
                            alt={item.name}
                            w={IMAGE_SIZE.CARD_ICON_SM}
                            h={IMAGE_SIZE.CARD_ICON_SM}
                            fit="contain"
                            loading="lazy"
                          />
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
                      <Table.Td className="table-badge-cell">
                        <Group
                          gap="xs"
                          wrap="wrap"
                          className="table-badge-list"
                        >
                          {item.bonuses.map((bonus) => (
                            <Badge
                              key={bonus}
                              variant="outline"
                              size="xs"
                              color={accent.secondary}
                            >
                              {bonus}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <RichText
                          text={item.effect}
                          statusEffects={statusEffects}
                        />
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
  );
}
