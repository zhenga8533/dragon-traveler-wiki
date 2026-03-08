import { Badge, Image } from '@mantine/core';
import { memo } from 'react';
import { GEAR_TYPE_ICON_MAP } from '../../assets/gear';
import { GEAR_TYPE_COLOR } from '../../constants/colors';
import { useGradientAccent } from '../../hooks';
import type { GearType } from '../../types/gear';
import { TAG_BADGE_STYLE } from './tag-badge-style';

export interface GearTypeTagProps {
  type: GearType;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function GearTypeTag({
  type,
  color,
  size = 'sm',
}: GearTypeTagProps) {
  const { accent } = useGradientAccent();
  const icon = GEAR_TYPE_ICON_MAP[type];

  return (
    <Badge
      variant="light"
      color={color ?? GEAR_TYPE_COLOR[type] ?? accent.primary}
      size={size}
      style={TAG_BADGE_STYLE}
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

export default memo(GearTypeTag);
