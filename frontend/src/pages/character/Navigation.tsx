import { Box, Group, Text } from '@mantine/core';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { CURSOR_POINTER_STYLE, LINK_RESET_STYLE } from '../../constants/styles';
import type { Character } from '../../types/character';

interface CharacterPageNavigationProps {
  previousCharacter: Character | null;
  nextCharacter: Character | null;
}

export default function CharacterPageNavigation({
  previousCharacter,
  nextCharacter,
}: CharacterPageNavigationProps) {
  return (
    <Box mt="xl">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        {previousCharacter ? (
          <Link
            to={`/characters/${encodeURIComponent(previousCharacter.name)}`}
            style={LINK_RESET_STYLE}
          >
            <Group gap="xs" c="violet" style={CURSOR_POINTER_STYLE}>
              <IoChevronBack />
              <Text size="sm">Previous: {previousCharacter.name}</Text>
            </Group>
          </Link>
        ) : (
          <Box />
        )}

        <Box />

        {nextCharacter ? (
          <Link
            to={`/characters/${encodeURIComponent(nextCharacter.name)}`}
            style={LINK_RESET_STYLE}
          >
            <Group gap="xs" c="violet" style={CURSOR_POINTER_STYLE}>
              <Text size="sm">Next: {nextCharacter.name}</Text>
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
