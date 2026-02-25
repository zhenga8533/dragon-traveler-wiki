import { Badge } from '@mantine/core';
import type { CSSProperties } from 'react';
import { TIER_COLOR } from '../../constants/colors';

export interface TierBadgeProps {
  tier: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showPrefix?: boolean;
  style?: CSSProperties;
}

export default function TierBadge({
  tier,
  size = 'sm',
  showPrefix = false,
  style,
}: TierBadgeProps) {
  const variant = tier === 'Unranked' ? 'default' : 'light';
  const color = TIER_COLOR[tier] ?? 'gray';

  return (
    <Badge variant={variant} color={color} size={size} style={style}>
      {showPrefix ? `Tier ${tier}` : tier}
    </Badge>
  );
}
