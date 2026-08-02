import { getMinWidthStyle } from '@/constants/styles';
import type { Character } from '@/features/characters/types';
import { ScrollArea, Table, Text } from '@mantine/core';
import GuessRow from './GuessRow';

interface GuessTableProps {
  guesses: Character[];
  answer: Character;
}

export default function GuessTable({ guesses, answer }: GuessTableProps) {
  if (guesses.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Your guesses will appear here.
      </Text>
    );
  }

  return (
    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
      <Table
        striped
        highlightOnHover
        style={getMinWidthStyle(720)}
        aria-live="polite"
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Character</Table.Th>
            <Table.Th>Class</Table.Th>
            <Table.Th>Quality</Table.Th>
            <Table.Th>Faction</Table.Th>
            <Table.Th>Origin</Table.Th>
            <Table.Th>Height</Table.Th>
            <Table.Th>Weight</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {[...guesses].reverse().map((guess) => (
            <GuessRow key={guess.slug} guess={guess} answer={answer} />
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
