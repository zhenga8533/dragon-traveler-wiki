import {
  Group,
  Image,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { IoInformationCircle } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { getPortrait } from '../../assets/character';
import { QUALITY_BORDER_COLOR } from '../../constants/colors';
import { FLEX_SHRINK_0_STYLE } from '../../constants/styles';
import { CHARACTER_CARD, TRANSITION } from '../../constants/ui';
import type { Quality } from '../../types/quality';
import TierBadge from '../common/TierBadge';

interface CharacterCardProps {
  name: string;
  quality?: Quality;
  size?: number;
  disableLink?: boolean;
  tierLabel?: string;
  note?: string;
}

export default function CharacterCard({
  name,
  quality,
  size = CHARACTER_CARD.PORTRAIT_SIZE,
  disableLink = false,
  tierLabel,
  note,
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
          <TierBadge tier={tierLabel} size="xs" style={FLEX_SHRINK_0_STYLE} />
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
