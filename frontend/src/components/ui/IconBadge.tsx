import type { MantineColor, MantineSize } from '@mantine/core';
import { Badge, Image, Popover } from '@mantine/core';
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
    <Popover
      width={280}
      shadow="md"
      withArrow
      closeOnClickOutside
      withinPortal
    >
      <Popover.Target>{badge}</Popover.Target>
      <Popover.Dropdown>{popoverContent}</Popover.Dropdown>
    </Popover>
  );
}
