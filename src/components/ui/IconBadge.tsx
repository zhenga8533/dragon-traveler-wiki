import type { MantineColor, MantineSize } from '@mantine/core';
import { Badge, Popover } from '@mantine/core';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { CURSOR_DEFAULT_STYLE, CURSOR_POINTER_STYLE } from '@/constants/styles';
import { POPOVER_BADGE_WIDTH } from '@/constants/ui';

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
  const [imgError, setImgError] = useState(false);
  const [prevIconSrc, setPrevIconSrc] = useState(iconSrc);

  if (iconSrc !== prevIconSrc) {
    setPrevIconSrc(iconSrc);
    setImgError(false);
  }

  const iconElement =
    iconSrc && !imgError ? (
      <img
        src={iconSrc}
        alt=""
        style={{ width: iconSize, height: iconSize, objectFit: 'contain', display: 'block' }}
        onError={() => setImgError(true)}
      />
    ) : undefined;

  const badge = (
    <Badge
      variant="light"
      color={color}
      size={size}
      // Mantine's polymorphic type overloads don't accept string directly; cast needed.
      component={component as 'span'}
      style={popoverContent ? CURSOR_POINTER_STYLE : CURSOR_DEFAULT_STYLE}
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
