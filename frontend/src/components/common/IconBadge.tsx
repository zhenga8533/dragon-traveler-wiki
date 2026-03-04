import { Badge, HoverCard, Image } from '@mantine/core';
import type { MantineColor, MantineSize } from '@mantine/core';
import type { ReactNode } from 'react';

export interface IconBadgeProps {
  label: ReactNode;
  color: MantineColor;
  size?: MantineSize;
  iconSrc?: string;
  iconSize?: number;
  component?: string;
  popoverContent?: ReactNode;
}

export default function IconBadge({
  label,
  color,
  size = 'sm',
  iconSrc,
  iconSize = 14,
  component = 'span',
  popoverContent,
}: IconBadgeProps) {
  const badge = (
    <Badge
      variant="light"
      color={color}
      size={size}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={component as any}
      style={popoverContent ? { cursor: 'pointer' } : { cursor: 'default' }}
      leftSection={
        iconSrc ? (
          <Image src={iconSrc} w={iconSize} h={iconSize} fit="contain" />
        ) : undefined
      }
    >
      {label}
    </Badge>
  );

  if (!popoverContent) return badge;

  return (
    <HoverCard width={280} shadow="md" withArrow openDelay={100} closeDelay={50}>
      <HoverCard.Target>{badge}</HoverCard.Target>
      <HoverCard.Dropdown>{popoverContent}</HoverCard.Dropdown>
    </HoverCard>
  );
}
