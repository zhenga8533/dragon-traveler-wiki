import { Badge } from '@mantine/core';
import type { CSSProperties } from 'react';
import { getTierColor } from '@/constants/tier-colors';

export interface TierBadgeProps {
  tier: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showPrefix?: boolean;
  index?: number;
  style?: CSSProperties;
}

export default function TierBadge({
  tier,
  size = 'sm',
  showPrefix = false,
  index = 0,
  style,
}: TierBadgeProps) {
  const variant = tier === 'N/A' ? 'default' : 'light';
  const color = getTierColor(tier, index);

  return (
    <Badge variant={variant} color={color} size={size} style={style}>
      {showPrefix ? `Tier ${tier}` : tier}
    </Badge>
  );
}
