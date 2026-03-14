import { Badge } from '@mantine/core';
import { memo } from 'react';

interface GlobalBadgeProps {
  isGlobal: boolean;
  size?: 'xs' | 'sm' | 'md';
}

function GlobalBadge({ isGlobal, size = 'sm' }: GlobalBadgeProps) {
  return (
    <Badge variant="light" size={size} color={isGlobal ? 'green' : 'orange'}>
      {isGlobal ? 'Global' : 'TW / CN'}
    </Badge>
  );
}

export default memo(GlobalBadge);
