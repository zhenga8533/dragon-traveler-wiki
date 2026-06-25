import { Badge } from '@mantine/core';
import { memo } from 'react';

interface GlobalBadgeProps {
  isGlobal: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

function GlobalBadge({ isGlobal, size = 'sm' }: GlobalBadgeProps) {
  return (
    <Badge variant="light" size={size} color={isGlobal ? 'teal' : 'gray'}>
      {isGlobal ? 'Global' : 'TW / CN'}
    </Badge>
  );
}

export default memo(GlobalBadge);
