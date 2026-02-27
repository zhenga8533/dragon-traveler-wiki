import { Badge, Box, Group, Skeleton, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useDataFetch } from '../../hooks';

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

export default function RecentUpdatesSection() {
  const { data: changelog, loading } = useDataFetch<ChangelogEntry[]>(
    'data/changelog.json',
    []
  );

  if (loading) {
    return (
      <Stack gap="xs">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={60} radius="md" />
        ))}
      </Stack>
    );
  }

  const recentEntries = [...changelog].slice(0, 3);

  if (recentEntries.length === 0) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No recent updates.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {recentEntries.map((entry) => (
        <Box
          key={entry.version ?? entry.date}
          p="xs"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'var(--mantine-color-default-hover)',
          }}
        >
          <Group justify="space-between" mb={4} wrap="wrap" gap={4}>
            <Text size="xs" fw={600}>
              {entry.version || entry.date}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Badge size="xs" variant="light" color="gray">
                {entry.changes.length} changes
              </Badge>
              <Text size="xs" c="dimmed">
                {entry.date}
              </Text>
            </Group>
          </Group>
          <Stack gap={2}>
            {entry.changes.slice(0, 2).map((change, cIdx) => (
              <Group key={cIdx} gap="xs" wrap="nowrap">
                <Badge
                  size="xs"
                  variant="light"
                  color={TYPE_COLORS[change.type] || 'gray'}
                  style={{ flexShrink: 0 }}
                >
                  {change.type}
                </Badge>
                <Text size="xs" lineClamp={1}>
                  {change.description}
                </Text>
              </Group>
            ))}
            {entry.changes.length > 2 && (
              <Text size="xs" c="dimmed" fs="italic">
                +{entry.changes.length - 2} more changes
              </Text>
            )}
          </Stack>
        </Box>
      ))}
      <Text
        component={Link}
        to="/changelog"
        size="xs"
        c="dimmed"
        td="underline"
        style={{ alignSelf: 'flex-end' }}
      >
        View full changelog
      </Text>
    </Stack>
  );
}
