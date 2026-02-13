import {
  Badge,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { useState } from 'react';
import {
  IoCheckmarkCircle,
  IoFlash,
  IoPeople,
  IoPricetag,
  IoSparkles,
} from 'react-icons/io5';
import { ListPageLoading } from '../components/PageLoadingSkeleton';
import PaginationControl from '../components/PaginationControl';
import { useDataFetch } from '../hooks';

interface ChangelogEntry {
  date: string;
  version?: string;
  changes: {
    type: 'added' | 'updated' | 'fixed' | 'removed';
    category:
      | 'characters'
      | 'status-effects'
      | 'wyrmspells'
      | 'codes'
      | 'teams'
      | 'tier-list'
      | 'site';
    description: string;
  }[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  characters: IoPeople,
  'status-effects': IoFlash,
  wyrmspells: IoSparkles,
  codes: IoPricetag,
  teams: IoCheckmarkCircle,
  'tier-list': IoCheckmarkCircle,
  site: IoCheckmarkCircle,
};

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
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(changelog.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const endIndex = startIndex + ENTRIES_PER_PAGE;
  const paginatedChangelog = changelog.slice(startIndex, endIndex);

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
              {paginatedChangelog.map((entry, _index) => {
                const entryDate = new Date(entry.date);
                const formattedDate = entryDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <Timeline.Item
                    key={entry.date}
                    bullet={<IoCheckmarkCircle size={20} />}
                    title={
                      <Group gap="sm">
                        <Text fw={600}>{formattedDate}</Text>
                        {entry.version && (
                          <Badge variant="light" color="violet">
                            v{entry.version}
                          </Badge>
                        )}
                      </Group>
                    }
                  >
                    <Stack gap="sm" mt="sm">
                      {entry.changes.map((change, changeIndex) => {
                        const Icon = CATEGORY_ICONS[change.category];
                        return (
                          <Paper
                            key={changeIndex}
                            p="sm"
                            radius="md"
                            withBorder
                          >
                            <Group gap="sm" wrap="nowrap">
                              {Icon && <Icon size={20} />}
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
                  </Timeline.Item>
                );
              })}
            </Timeline>

            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
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
