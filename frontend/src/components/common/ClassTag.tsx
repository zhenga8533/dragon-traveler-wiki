import { Badge, Image } from '@mantine/core';
import { memo } from 'react';
import { CLASS_ICON_MAP } from '../../assets/class';
import { CLASS_COLOR } from '../../constants/colors';
import { useGradientAccent } from '../../hooks';
import type { CharacterClass } from '../../types/character';
import { TAG_BADGE_STYLE } from './tag-badge-style';

export interface ClassTagProps {
  characterClass: CharacterClass | string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
}

function ClassTag({
  characterClass,
  color,
  size = 'sm',
  showIcon = true,
}: ClassTagProps) {
  const { accent } = useGradientAccent();
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
      style={TAG_BADGE_STYLE}
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

export default memo(ClassTag);
