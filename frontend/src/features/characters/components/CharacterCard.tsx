import { Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router-dom';
import { CHARACTER_CARD, TRANSITION } from '@/constants/ui';
import { useGradientAccent } from '@/hooks';
import type { Quality } from '@/types/quality';
import { getCharacterRoutePathByName } from '@/features/characters/utils/character-route';
import NoteTooltipIcon from '@/components/ui/NoteTooltipIcon';
import TierBadge from '@/features/tier-list/components/TierBadge';
import CharacterPortrait from './CharacterPortrait';

interface CharacterCardProps {
  name: string;
  /** Override the displayed name label without affecting portrait asset lookup. */
  label?: string;
  quality?: Quality;
  size?: number;
  disableLink?: boolean;
  tierLabel?: string;
  note?: string;
  routePath?: string;
  clampName?: boolean;
}

export default function CharacterCard({
  name,
  label,
  quality,
  size = CHARACTER_CARD.PORTRAIT_SIZE,
  disableLink = false,
  tierLabel,
  note,
  routePath,
  clampName = true,
}: CharacterCardProps) {
  const { accent } = useGradientAccent();
  const nameColor = disableLink ? 'dimmed' : `${accent.primary}.7`;

  const portrait = (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <CharacterPortrait
        name={name}
        size={size}
        quality={quality}
        borderWidth={CHARACTER_CARD.BORDER_WIDTH}
        routePath={routePath}
      />
      {note && (
        <NoteTooltipIcon
          note={note}
          ariaLabel={`Show note for ${name}`}
          stopPropagation
          wrapperStyle={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
        />
      )}
    </div>
  );

  const content = (
    <Stack gap={2} align="center">
      {portrait}
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
          lineClamp={clampName ? 1 : undefined}
          c={nameColor}
          style={{
            minWidth: 0,
            whiteSpace: clampName ? undefined : 'normal',
          }}
        >
          {label ?? name}
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
      to={routePath ?? getCharacterRoutePathByName(name)}
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
