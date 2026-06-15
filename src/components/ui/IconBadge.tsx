import type { MantineColor, MantineSize } from '@mantine/core';
import { Badge, Popover } from '@mantine/core';
import type { ReactNode } from 'react';
import {
  CURSOR_DEFAULT_STYLE,
  CURSOR_POINTER_STYLE,
  RICH_TEXT_BADGE_STYLE,
} from '@/constants/styles';
import { POPOVER_BADGE_WIDTH } from '@/constants/ui';
import SafeImage from '@/components/ui/SafeImage';

export interface IconBadgeProps {
  label: ReactNode;
  color: MantineColor;
  size?: MantineSize;
  iconSrc?: string;
  iconSize?: number;
  /** HTML tag name for the badge root element (e.g. "span", "a"). */
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
  const iconElement = iconSrc ? (
    <SafeImage
      src={iconSrc}
      alt=""
      w={iconSize}
      h={iconSize}
      fit="contain"
      style={{ display: 'block' }}
    />
  ) : undefined;

  const badge = (
    <Badge
      variant="light"
      color={color}
      size={size}
      // Mantine's polymorphic type overloads don't accept string directly; cast needed.
      component={component as 'span'}
      style={{
        ...RICH_TEXT_BADGE_STYLE,
        ...(popoverContent ? CURSOR_POINTER_STYLE : CURSOR_DEFAULT_STYLE),
      }}
      leftSection={iconElement}
    >
      {label}
    </Badge>
  );

  if (!popoverContent) return badge;

  return (
    <Popover
      width={POPOVER_BADGE_WIDTH}
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
