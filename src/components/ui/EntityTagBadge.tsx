import { TAG_BADGE_STYLE } from '@/constants/styles';
import { Badge } from '@mantine/core';
import SafeImage from './SafeImage';
import { memo } from 'react';

export interface EntityTagBadgeProps {
  label: string;
  color: string;
  iconSrc?: string;
  iconSize?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function EntityTagBadge({
  label,
  color,
  iconSrc,
  iconSize = 14,
  size = 'sm',
}: EntityTagBadgeProps) {
  return (
    <Badge
      variant="light"
      color={color}
      size={size}
      style={TAG_BADGE_STYLE}
      leftSection={
        iconSrc ? (
          <SafeImage
            src={iconSrc}
            alt={label}
            w={iconSize}
            h={iconSize}
            fit="contain"
            loading="lazy"
          />
        ) : undefined
      }
    >
      {label}
    </Badge>
  );
}

export default memo(EntityTagBadge);
