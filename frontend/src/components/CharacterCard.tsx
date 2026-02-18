import { Badge, Image, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IoInformationCircle } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { getPortrait } from '../assets/character';
import { CHARACTER_CARD, TRANSITION } from '../constants/ui';
import type { Quality } from '../types/character';

const QUALITY_BORDER_COLOR: Record<Quality, string> = {
  UR: 'var(--mantine-color-pink-6)',
  'SSR EX': 'var(--mantine-color-red-6)',
  'SSR+': 'var(--mantine-color-orange-5)',
  SSR: 'var(--mantine-color-yellow-5)',
  SR: 'var(--mantine-color-violet-5)',
  R: 'var(--mantine-color-blue-5)',
  N: 'var(--mantine-color-lime-5)',
};

interface CharacterCardProps {
  name: string;
  quality?: Quality;
  size?: number;
  disableLink?: boolean;
  tierLabel?: string;
  note?: string;
  is_global?: boolean;
}

export default function CharacterCard({
  name,
  quality,
  size = CHARACTER_CARD.PORTRAIT_SIZE,
  disableLink = false,
  tierLabel,
  note,
  is_global,
}: CharacterCardProps) {
  const borderColor = quality
    ? QUALITY_BORDER_COLOR[quality]
    : 'var(--mantine-color-gray-5)';
  const nameColor = disableLink ? 'dimmed' : 'violet';

  const portrait = (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Image
        src={getPortrait(name)}
        alt={name}
        h={size}
        w={size}
        fit="cover"
        radius="50%"
        loading="lazy"
        fallbackSrc={`https://placehold.co/${size}x${size}?text=${encodeURIComponent(name.charAt(0))}`}
        style={{
          border: `${CHARACTER_CARD.BORDER_WIDTH}px solid ${borderColor}`,
          transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}, box-shadow ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        }}
      />
      {note && (
        <IoInformationCircle
          size={18}
          color="var(--mantine-color-blue-5)"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'var(--mantine-color-body)',
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
      <Text size="xs" fw={500} ta="center" lineClamp={1} c={nameColor}>
        {name}
      </Text>
      {is_global !== undefined && (
        <Badge variant="light" size="sm" color={is_global ? 'green' : 'orange'}>
          {is_global ? 'Global' : 'TW / CN'}
        </Badge>
      )}
      {tierLabel && (
        <Text size="xs" ta="center" c="dimmed">
          {tierLabel}
        </Text>
      )}
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          },
        },
      }}
    >
      {content}
    </UnstyledButton>
  );
}

export { QUALITY_BORDER_COLOR };
