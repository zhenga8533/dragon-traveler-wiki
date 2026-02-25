import {
  Badge,
  Button,
  Collapse,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { useState } from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { ListPageLoading } from '../components/layout/PageLoadingSkeleton';
import PaginationControl from '../components/common/PaginationControl';
import { useDataFetch } from '../hooks';
import { usePagination } from '../hooks/use-pagination';

interface ChangelogEntry {
  date: string;
  version?: string;
  changes: {
    type: 'added' | 'updated' | 'fixed' | 'removed';
    category: string;
    description: string;
  }[];
}

const TYPE_COLORS: Record<string, string> = {
  added: 'green',
  updated: 'blue',
  fixed: 'orange',
  removed: 'red',
};

const ENTRIES_PER_PAGE = 10;

export default function Changelog() {
  const { data: changelog, loading } = useDataFetch<ChangelogEntry[]>(
    'data/changelog.json',
    []
  );
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    () => new Set()
  );
  const { page, setPage, totalPages, offset } = usePagination(
    changelog.length,
    ENTRIES_PER_PAGE,
    String(changelog.length)
  );
  const paginatedChangelog = changelog.slice(offset, offset + ENTRIES_PER_PAGE);

  function toggleEntry(entryId: number) {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Changelog</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Track updates to the Dragon Traveler Wiki database
          </Text>
        </div>

        {loading && <ListPageLoading cards={4} />}

        {!loading && changelog.length === 0 && (
          <Text c="dimmed" ta="center" py="lg">
            No changelog entries available yet.
          </Text>
        )}

        {!loading && changelog.length > 0 && (
          <>
            <Timeline active={-1} bulletSize={32} lineWidth={2}>
              {paginatedChangelog.map((entry, entryIndex) => {
                const entryDate = new Date(entry.date);
                const formattedDate = entryDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                const entryId = offset + entryIndex;
                const isExpanded = expandedEntries.has(entryId);

                return (
                  <Timeline.Item
                    key={entry.date}
                    bullet={<IoCheckmarkCircle size={20} />}
                    title={
                      <Group justify="space-between" wrap="wrap" gap="sm">
                        <Group gap="sm">
                          <Text fw={600}>{formattedDate}</Text>
                          {entry.version && (
                            <Badge variant="light" color="violet">
                              v{entry.version}
                            </Badge>
                          )}
                        </Group>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => toggleEntry(entryId)}
                        >
                          {isExpanded ? 'Minimize' : 'Expand'}
                        </Button>
                      </Group>
                    }
                  >
                    <Stack gap="xs" mt="sm">
                      {!isExpanded && (
                        <Text size="sm" c="dimmed">
                          {entry.changes.length} changes (expand to view
                          details)
                        </Text>
                      )}
                      <Collapse in={isExpanded}>
                        <Stack gap="sm">
                          {entry.changes.map((change, changeIndex) => {
                            return (
                              <Paper
                                key={`${change.type}-${change.category}-${changeIndex}`}
                                p="sm"
                                radius="md"
                                withBorder
                              >
                                <Group gap="sm" wrap="nowrap">
                                  <Stack gap={4} style={{ flex: 1 }}>
                                    <Group gap="xs">
                                      <Badge
                                        size="sm"
                                        variant="dot"
                                        color={TYPE_COLORS[change.type]}
                                      >
                                        {change.type.charAt(0).toUpperCase() +
                                          change.type.slice(1)}
                                      </Badge>
                                      <Badge size="sm" variant="light">
                                        {change.category}
                                      </Badge>
                                    </Group>
                                    <Text size="sm">{change.description}</Text>
                                  </Stack>
                                </Group>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Collapse>
                    </Stack>
                  </Timeline.Item>
                );
              })}
            </Timeline>

            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          </>
        )}

        <Paper
          p="md"
          radius="md"
          withBorder
          style={{ marginTop: 'var(--mantine-spacing-xl)' }}
        >
          <Text size="sm" c="dimmed" ta="center">
            This changelog tracks major updates to the wiki database. For site
            improvements and bug fixes, check the GitHub repository.
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
}
