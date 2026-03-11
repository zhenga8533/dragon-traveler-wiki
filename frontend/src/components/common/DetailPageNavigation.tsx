import { Box, Group, Paper, Text } from '@mantine/core';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { useGradientAccent } from '@/hooks';

type DetailNavigationItem = {
  label: string;
  path: string;
};

interface DetailPageNavigationProps {
  previousItem?: DetailNavigationItem | null;
  nextItem?: DetailNavigationItem | null;
}

export default function DetailPageNavigation({
  previousItem,
  nextItem,
}: DetailPageNavigationProps) {
  const { accent } = useGradientAccent();

  if (!previousItem && !nextItem) return null;

  return (
    <Box mt="xl">
      <Group justify="space-between" align="stretch" wrap="wrap" gap="sm">
        {previousItem ? (
          <Link
            to={previousItem.path}
            style={{ textDecoration: 'none', flex: '1 1 220px' }}
          >
            <Paper
              withBorder
              p="sm"
              radius="md"
              style={{ minHeight: 48, display: 'flex', alignItems: 'center' }}
            >
              <Group
                gap="xs"
                c={`${accent.primary}.7`}
                style={{ cursor: 'pointer' }}
              >
                <IoChevronBack />
                <Text size="sm">Previous: {previousItem.label}</Text>
              </Group>
            </Paper>
          </Link>
        ) : (
          <Box style={{ flex: '1 1 220px' }} />
        )}

        <Box />

        {nextItem ? (
          <Link
            to={nextItem.path}
            style={{ textDecoration: 'none', flex: '1 1 220px' }}
          >
            <Paper
              withBorder
              p="sm"
              radius="md"
              style={{
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Group
                gap="xs"
                c={`${accent.primary}.7`}
                style={{ cursor: 'pointer' }}
              >
                <Text size="sm">Next: {nextItem.label}</Text>
                <IoChevronForward />
              </Group>
            </Paper>
          </Link>
        ) : (
          <Box style={{ flex: '1 1 220px' }} />
        )}
      </Group>
    </Box>
  );
}
