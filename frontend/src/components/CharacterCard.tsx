import { Image, Stack, Text } from '@mantine/core';
import { getPortrait } from '../assets/portrait';
import type { Quality } from '../types/character';

const QUALITY_BORDER_COLOR: Record<Quality, string> = {
  'SSR EX': 'var(--mantine-color-red-6)',
  'SSR+': 'var(--mantine-color-orange-5)',
  SSR: 'var(--mantine-color-yellow-5)',
  'SR+': 'var(--mantine-color-violet-5)',
  R: 'var(--mantine-color-blue-5)',
  N: 'var(--mantine-color-gray-5)',
};

interface CharacterCardProps {
  name: string;
  quality?: Quality;
  size?: number;
}

export default function CharacterCard({ name, quality, size = 80 }: CharacterCardProps) {
  const borderColor = quality
    ? QUALITY_BORDER_COLOR[quality]
    : 'var(--mantine-color-gray-5)';

  return (
    <Stack gap={2} align="center">
      <Image
        src={getPortrait(name)}
        alt={name}
        h={size}
        w={size}
        fit="cover"
        radius="50%"
        style={{
          border: `3px solid ${borderColor}`,
        }}
      />
      <Text size="xs" fw={500} ta="center" lineClamp={1}>
        {name}
      </Text>
    </Stack>
  );
}

export { QUALITY_BORDER_COLOR };
