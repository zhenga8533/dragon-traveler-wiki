import { Badge, Image } from '@mantine/core';
import { useContext } from 'react';
import { CLASS_ICON_MAP } from '../../assets/class';
import { CLASS_COLOR } from '../../constants/colors';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';
import type { CharacterClass } from '../../types/character';

export interface ClassTagProps {
  characterClass: CharacterClass | string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
}

export default function ClassTag({
  characterClass,
  color,
  size = 'sm',
  showIcon = true,
}: ClassTagProps) {
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
  const classColor = (CLASS_COLOR as Record<string, string | undefined>)[
    characterClass
  ];
  const icon = (CLASS_ICON_MAP as Record<string, string | undefined>)[
    characterClass
  ];

  return (
    <Badge
      variant="light"
      color={color ?? classColor ?? accent.secondary}
      size={size}
      leftSection={
        showIcon && icon ? (
          <Image
            src={icon}
            alt={characterClass}
            w={12}
            h={12}
            fit="contain"
            loading="lazy"
          />
        ) : undefined
      }
    >
      {characterClass}
    </Badge>
  );
}
