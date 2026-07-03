import { Link } from 'react-router-dom';
import { Badge, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import ListPageShell from '@/components/layout/ListPageShell';
import SearchableGridPanel from '@/components/layout/SearchableGridPanel';
import { LINK_BLOCK_RESET_STYLE, getCardHoverProps } from '@/constants/styles';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import type { Gear, GearSet } from '@/features/wiki/gear/types';
import type { GradientPaletteAccents } from '@/contexts';

interface GearSetsTabProps {
  loading: boolean;
  error: Error | null;
  gearSets: GearSet[];
  search: string;
  onSearchChange: (value: string) => void;
  filtered: GearSet[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageItems: GearSet[];
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (pageSize: number) => void;
  gearItemsBySet: Map<string, Gear[]>;
  accent: GradientPaletteAccents;
}

export default function GearSetsTab({
  loading,
  error,
  gearSets,
  search,
  onSearchChange,
  filtered,
  page,
  totalPages,
  onPageChange,
  pageItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  gearItemsBySet,
  accent,
}: GearSetsTabProps) {
  return (
    <ListPageShell
      loading={loading}
      error={error}
      errorTitle="Could not load gear sets"
      hasData={gearSets.length > 0}
      emptyMessage="No gear set data available yet."
      skeletonCards={4}
    >
      <SearchableGridPanel
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search by set name or bonus..."
        hasResults={filtered.length > 0}
        noResultsTitle="No gear sets found"
        noResultsMessage="No gear sets match the search."
        onResetSearch={() => onSearchChange('')}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={filtered.length}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {pageItems.map((set) => {
            const items = gearItemsBySet.get(set.slug) ?? [];
            const setBonus = set.set_bonus;
            const bonusQuantity = setBonus?.quantity ?? 0;
            const bonusDescription = setBonus?.description ?? '';
            return (
              <Paper
                key={set.name}
                component={Link}
                to={`/gear-sets/${set.slug}`}
                p="md"
                radius="md"
                withBorder
                {...getCardHoverProps({
                  interactive: true,
                  style: LINK_BLOCK_RESET_STYLE,
                })}
              >
                <Stack gap="xs">
                  <Group justify="space-between" align="center">
                    <Text fw={700} className="dt-link-text" lineClamp={1}>
                      {set.name}
                    </Text>
                    {bonusQuantity > 0 && (
                      <Badge variant="light" size="sm" color={accent.tertiary}>
                        {bonusQuantity}-piece
                      </Badge>
                    )}
                  </Group>

                  <Text size="sm" c="dimmed">
                    {bonusQuantity > 0
                      ? bonusDescription || 'No set bonus description.'
                      : 'No set bonus.'}
                  </Text>

                  <Group gap="xs" wrap="wrap">
                    <Badge variant="light" size="sm" color={accent.secondary}>
                      {items.length} item
                      {items.length === 1 ? '' : 's'}
                    </Badge>
                    {items.slice(0, 4).map((item) => (
                      <GearTypeTag key={item.name} type={item.type} />
                    ))}
                  </Group>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      </SearchableGridPanel>
    </ListPageShell>
  );
}
