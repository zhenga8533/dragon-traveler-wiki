import { Link } from 'react-router';
import { Badge, Group, Paper, SimpleGrid, Stack, Table, Text } from '@mantine/core';
import ListPageShell from '@/components/layout/ListPageShell';
import { CardGridLoading } from '@/components/layout/PageLoadingSkeleton';
import SearchableGridPanel from '@/components/layout/SearchableGridPanel';
import HowlkinBadge from '@/features/wiki/howlkins/components/HowlkinBadge';
import type { GoldenAlliance, Howlkin } from '@/features/wiki/howlkins/types';
import { LINK_BLOCK_RESET_STYLE, getCardHoverProps } from '@/constants/styles';
import { QUALITY_ORDER } from '@/constants/quality';
import type { GradientPaletteAccents } from '@/contexts';
import type { Quality } from '@/types/quality';

interface GoldenAlliancesTabProps {
  loading: boolean;
  error: Error | null;
  goldenAlliances: GoldenAlliance[];
  search: string;
  onSearchChange: (value: string) => void;
  filtered: GoldenAlliance[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageItems: GoldenAlliance[];
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (pageSize: number) => void;
  howlkinMap: Map<string, Howlkin>;
  accent: GradientPaletteAccents;
}

export default function GoldenAlliancesTab({
  loading,
  error,
  goldenAlliances,
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
  howlkinMap,
  accent,
}: GoldenAlliancesTabProps) {
  return (
    <ListPageShell
      loading={loading}
      error={error}
      hasData={goldenAlliances.length > 0}
      emptyMessage="Golden alliance data hasn't been added yet."
      errorTitle="Could not load golden alliances"
      loadingFallback={
        <CardGridLoading cardHeight={180} showPagination />
      }
    >
      <SearchableGridPanel
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search by name or member..."
        hasResults={filtered.length > 0}
        noResultsTitle="No alliances found"
        noResultsMessage="No alliances match the search."
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
          {pageItems.map((alliance) => (
            <Paper
              key={alliance.name}
              component={Link}
              to={`/howlkins/${alliance.slug}`}
              p="md"
              radius="md"
              withBorder
              {...getCardHoverProps({
                interactive: true,
                style: LINK_BLOCK_RESET_STYLE,
              })}
            >
              <Stack gap="sm">
                <Text fw={700} size="lg" className="dt-link-text">
                  {alliance.name}
                </Text>

                <div>
                  <Text size="xs" c="dimmed" fw={600} mb={4}>
                    MEMBERS ({alliance.howlkins.length})
                  </Text>
                  <Group gap="xs" wrap="wrap">
                    {[...alliance.howlkins]
                      .sort((a, b) => {
                        const qA = QUALITY_ORDER.indexOf(
                          howlkinMap.get(a)?.quality ?? ('' as Quality)
                        );
                        const qB = QUALITY_ORDER.indexOf(
                          howlkinMap.get(b)?.quality ?? ('' as Quality)
                        );
                        if (qA !== qB) return qA - qB;
                        return a.localeCompare(b);
                      })
                      .map((howlkinSlug) => {
                        const howlkin = howlkinMap.get(howlkinSlug);
                        if (!howlkin) return null;
                        return (
                          <HowlkinBadge
                            key={howlkinSlug}
                            name={howlkin.name}
                            howlkin={howlkin}
                          />
                        );
                      })}
                  </Group>
                </div>

                <div>
                  <Text size="xs" c="dimmed" fw={600} mb={4}>
                    ALLIANCE EFFECTS
                  </Text>
                  <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: 70 }}>Level</Table.Th>
                        <Table.Th>Stats</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {alliance.effects.map((effect) => (
                        <Table.Tr key={effect.level}>
                          <Table.Td>
                            <Badge variant="light" size="sm" color={accent.secondary}>
                              {effect.level}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} wrap="wrap">
                              {effect.stats.map((stat, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  size="sm"
                                  color={accent.secondary}
                                >
                                  {stat}
                                </Badge>
                              ))}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </SearchableGridPanel>
    </ListPageShell>
  );
}
