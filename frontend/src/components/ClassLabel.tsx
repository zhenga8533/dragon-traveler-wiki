import type { TextProps } from '@mantine/core';
import { Group, Image, Text } from '@mantine/core';
import { CLASS_ICON_MAP } from '../assets/class';
import type { CharacterClass } from '../types/character';

interface ClassLabelProps {
  characterClass: CharacterClass | string;
  count?: number;
  iconSize?: number;
  textSize?: TextProps['size'];
  gap?: number;
  showText?: boolean;
}

export default function ClassLabel({
  characterClass,
  count,
  iconSize = 12,
  textSize = 'xs',
  gap = 4,
  showText = true,
}: ClassLabelProps) {
  const iconSrc = (CLASS_ICON_MAP as Record<string, string | undefined>)[
    characterClass
  ];

  return (
    <Group gap={gap} wrap="nowrap">
      {iconSrc && (
        <Image
          src={iconSrc}
          alt={characterClass}
          w={iconSize}
          h={iconSize}
          fit="contain"
        />
      )}
      {showText && (
        <Text size={textSize} span>
          {count == null ? characterClass : `${characterClass}: ${count}`}
        </Text>
      )}
    </Group>
  );
}
