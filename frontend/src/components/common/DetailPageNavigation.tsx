import { Box, Group, Text } from '@mantine/core';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { CURSOR_POINTER_STYLE, LINK_RESET_STYLE } from '../../constants/styles';

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
          <Link to={previousItem.path} style={LINK_RESET_STYLE}>
            <Group gap="xs" c="violet" style={CURSOR_POINTER_STYLE}>
              <IoChevronBack />
              <Text size="sm">Previous: {previousItem.label}</Text>
            </Group>
          </Link>
        ) : (
          <Box />
        )}

        <Box />

        {nextItem ? (
          <Link to={nextItem.path} style={LINK_RESET_STYLE}>
            <Group gap="xs" c="violet" style={CURSOR_POINTER_STYLE}>
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
