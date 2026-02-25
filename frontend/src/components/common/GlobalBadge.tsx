import { Badge } from '@mantine/core';

interface GlobalBadgeProps {
  isGlobal: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export default function GlobalBadge({ isGlobal, size = 'sm' }: GlobalBadgeProps) {
  return (
    <Badge variant="light" size={size} color={isGlobal ? 'green' : 'orange'}>
      {isGlobal ? 'Global' : 'TW / CN'}
    </Badge>
  );
}
