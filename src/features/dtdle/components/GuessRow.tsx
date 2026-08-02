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

const FACTION_STATUS_LABEL: Record<'exact' | 'partial' | 'none', string> = {
  exact: 'same factions as the answer',
  partial: 'some factions overlap with the answer',
  none: 'no factions match the answer',
};

interface GuessRowProps {
  guess: Character;
  answer: Character;
}

const ORDINAL_ARIA_LABEL: Record<
  'exact' | 'higher' | 'lower' | 'unknown',
  string
> = {
  exact: 'exact match',
  higher: "answer's value is higher",
  lower: "answer's value is lower",
  unknown: 'no data to compare',
};

function OrdinalBadge({
  label,
  status,
}: {
  label: ReactNode;
  status: 'exact' | 'higher' | 'lower' | 'unknown';
}) {
  return (
    <Badge
      color={status === 'exact' ? 'green' : 'gray'}
      variant="filled"
      aria-label={ORDINAL_ARIA_LABEL[status]}
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
          label={
            <QualityIcon
              quality={guess.quality}
              size={16}
              showTooltip={false}
            />
          }
          status={cmp.qualityStatus}
        />
      </Table.Td>
      <Table.Td>
        <Box
          role="img"
          aria-label={FACTION_STATUS_LABEL[cmp.factionStatus]}
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
        <Badge
          color={cmp.originStatus === 'exact' ? 'green' : 'red'}
          variant="filled"
        >
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
