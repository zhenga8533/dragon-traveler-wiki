import { Group, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IoInformationCircle } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { CHARACTER_CARD, TRANSITION } from '../../constants/ui';
import type { Quality } from '../../types/quality';
import TierBadge from '../common/TierBadge';
import CharacterPortrait from './CharacterPortrait';

interface CharacterCardProps {
  name: string;
  quality?: Quality;
  size?: number;
  disableLink?: boolean;
  tierLabel?: string;
  note?: string;
  noteIconVariant?: 'default' | 'builder';
}

export default function CharacterCard({
  name,
  quality,
  size = CHARACTER_CARD.PORTRAIT_SIZE,
  disableLink = false,
  tierLabel,
  note,
  noteIconVariant = 'default',
}: CharacterCardProps) {
  const nameColor = disableLink ? 'dimmed' : 'violet';
  const isBuilderNoteVariant = noteIconVariant === 'builder';

  const portrait = (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <CharacterPortrait
        name={name}
        size={size}
        quality={quality}
        borderWidth={CHARACTER_CARD.BORDER_WIDTH}
      />
      {note && (
        <IoInformationCircle
          size={18}
          color={
            isBuilderNoteVariant
              ? 'var(--mantine-color-violet-1)'
              : 'var(--mantine-color-blue-5)'
          }
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: isBuilderNoteVariant
              ? 'linear-gradient(135deg, var(--mantine-color-violet-6) 0%, var(--mantine-color-grape-6) 100%)'
              : 'var(--mantine-color-body)',
            border: isBuilderNoteVariant
              ? '1px solid var(--mantine-color-violet-4)'
              : undefined,
            boxShadow: isBuilderNoteVariant
              ? '0 4px 10px rgba(124, 58, 237, 0.28)'
              : undefined,
            borderRadius: '50%',
          }}
        />
      )}
    </div>
  );

  const content = (
    <Stack gap={2} align="center">
      {note ? (
        <Tooltip label={note} multiline withArrow maw={250}>
          {portrait}
        </Tooltip>
      ) : (
        portrait
      )}
      <Group
        gap={4}
        justify="center"
        wrap="nowrap"
        style={{ maxWidth: '100%' }}
      >
        <Text
          size="xs"
          fw={500}
          ta="center"
          lineClamp={1}
          c={nameColor}
          style={{ minWidth: 0 }}
        >
          {name}
        </Text>
        {tierLabel && (
          <TierBadge tier={tierLabel} size="xs" style={{ flexShrink: 0 }} />
        )}
      </Group>
    </Stack>
  );

  if (disableLink) {
    return content;
  }

  return (
    <UnstyledButton
      component={Link}
      to={`/characters/${encodeURIComponent(name)}`}
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'scale(1.05)',
          },
          '&:hover img': {
            boxShadow: 'var(--mantine-shadow-md)',
          },
        },
      }}
    >
      {content}
    </UnstyledButton>
  );
}
