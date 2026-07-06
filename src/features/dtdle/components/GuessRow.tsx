import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import ClassTag from '@/components/ui/ClassTag';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import type { Character } from '@/features/characters/types';
import { Badge, Box, Group, Table, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { IoArrowDown, IoArrowUp } from 'react-icons/io5';
import { compareGuessToAnswer } from '../utils/compare-guess';

const STATUS_BORDER_COLOR: Record<'exact' | 'partial' | 'none', string> = {
  exact: 'var(--mantine-color-green-6)',
  partial: 'var(--mantine-color-yellow-6)',
  none: 'var(--mantine-color-red-6)',
};

interface GuessRowProps {
  guess: Character;
  answer: Character;
}

function OrdinalBadge({
  label,
  status,
}: {
  label: ReactNode;
  status: 'exact' | 'higher' | 'lower';
}) {
  return (
    <Badge
      color={status === 'exact' ? 'green' : 'gray'}
      variant="filled"
      rightSection={
        status === 'higher' ? (
          <IoArrowUp size={12} />
        ) : status === 'lower' ? (
          <IoArrowDown size={12} />
        ) : undefined
      }
    >
      {label}
    </Badge>
  );
}

export default function GuessRow({ guess, answer }: GuessRowProps) {
  const cmp = compareGuessToAnswer(guess, answer);

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <CharacterPortrait
            name={guess.name}
            assetKey={guess.slug}
            size={36}
            quality={guess.quality}
          />
          <Text size="sm" fw={500}>
            {guess.name}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <ClassTag
          characterClass={guess.character_class}
          color={cmp.classStatus === 'exact' ? 'green' : 'red'}
        />
      </Table.Td>
      <Table.Td>
        <OrdinalBadge
          label={<QualityIcon quality={guess.quality} size={16} showTooltip={false} />}
          status={cmp.qualityStatus}
        />
      </Table.Td>
      <Table.Td>
        <Box
          style={{
            display: 'inline-flex',
            border: `2px solid ${STATUS_BORDER_COLOR[cmp.factionStatus]}`,
            borderRadius: 'var(--mantine-radius-sm)',
            padding: 4,
          }}
        >
          <Group gap={4} wrap="wrap">
            {guess.factions.map((faction) => (
              <FactionTag key={faction} faction={faction} size="xs" />
            ))}
          </Group>
        </Box>
      </Table.Td>
      <Table.Td>
        <Badge color={cmp.originStatus === 'exact' ? 'green' : 'red'} variant="filled">
          {guess.origin}
        </Badge>
      </Table.Td>
      <Table.Td>
        <OrdinalBadge label={guess.height} status={cmp.heightStatus} />
      </Table.Td>
      <Table.Td>
        <OrdinalBadge label={guess.weight} status={cmp.weightStatus} />
      </Table.Td>
    </Table.Tr>
  );
}
