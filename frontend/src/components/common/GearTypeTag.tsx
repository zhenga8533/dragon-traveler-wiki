import { Badge, Image } from '@mantine/core';
import { useContext } from 'react';
import { GEAR_TYPE_ICON_MAP } from '../../assets/gear';
import { GEAR_TYPE_COLOR } from '../../constants/colors';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';
import type { GearType } from '../../types/gear';

export interface GearTypeTagProps {
  type: GearType;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function GearTypeTag({
  type,
  color,
  size = 'sm',
}: GearTypeTagProps) {
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
  const icon = GEAR_TYPE_ICON_MAP[type];

  return (
    <Badge
      variant="light"
      color={color ?? GEAR_TYPE_COLOR[type] ?? accent.primary}
      size={size}
      leftSection={
        icon ? (
          <Image
            src={icon}
            alt={type}
            w={12}
            h={12}
            fit="contain"
            loading="lazy"
          />
        ) : undefined
      }
    >
      {type}
    </Badge>
  );
}
