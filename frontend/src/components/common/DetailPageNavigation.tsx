import { Box, Group, Text } from '@mantine/core';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { Link } from 'react-router-dom';

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
  if (!previousItem && !nextItem) return null;

  return (
    <Box mt="xl">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        {previousItem ? (
          <Link to={previousItem.path} style={{ textDecoration: 'none' }}>
            <Group gap="xs" c="violet" style={{ cursor: 'pointer' }}>
              <IoChevronBack />
              <Text size="sm">Previous: {previousItem.label}</Text>
            </Group>
          </Link>
        ) : (
          <Box />
        )}

        <Box />

        {nextItem ? (
          <Link to={nextItem.path} style={{ textDecoration: 'none' }}>
            <Group gap="xs" c="violet" style={{ cursor: 'pointer' }}>
              <Text size="sm">Next: {nextItem.label}</Text>
              <IoChevronForward />
            </Group>
          </Link>
        ) : (
          <Box />
        )}
      </Group>
    </Box>
  );
}
