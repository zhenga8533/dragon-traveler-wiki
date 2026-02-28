import { Image, Tooltip, type TooltipProps } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getPortrait } from '../../assets/character';
import { QUALITY_BORDER_COLOR } from '../../constants/colors';
import { getCharacterPortraitHoverProps } from '../../constants/styles';
import type { Quality } from '../../types/quality';

interface CharacterPortraitProps {
  name: string;
  size: number;
  quality?: Quality;
  borderWidth?: number;
  borderColor?: string;
  isSubstitute?: boolean;
  link?: boolean;
  tooltip?: ReactNode;
  tooltipProps?: Partial<TooltipProps>;
  loading?: 'lazy' | 'eager';
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  className?: string;
  style?: CSSProperties;
  fallbackSrc?: string;
}

export default function CharacterPortrait({
  name,
  size,
  quality,
  borderWidth = 2,
  borderColor,
  isSubstitute = false,
  link = false,
  tooltip,
  tooltipProps,
  loading = 'lazy',
  fit = 'cover',
  className,
  style,
  fallbackSrc,
}: CharacterPortraitProps) {
  const resolvedBorderColor =
    borderColor ??
    (quality ? QUALITY_BORDER_COLOR[quality] : 'var(--mantine-color-gray-5)');

  const portrait = (
    <Image
      src={getPortrait(name)}
      alt={name}
      w={size}
      h={size}
      fit={fit}
      radius="50%"
      loading={loading}
      className={className}
      fallbackSrc={
        fallbackSrc ??
        `https://placehold.co/${size}x${size}?text=${encodeURIComponent(name.charAt(0))}`
      }
      {...getCharacterPortraitHoverProps({
        isSubstitute,
        style: {
          ...(borderWidth > 0
            ? {
                border: `${borderWidth}px solid ${resolvedBorderColor}`,
                borderRadius: '50%',
              }
            : {}),
          ...style,
        },
      })}
    />
  );

  const linkedPortrait = link ? (
    <Link
      to={`/characters/${encodeURIComponent(name)}`}
      style={{ display: 'inline-flex', textDecoration: 'none' }}
      aria-label={`View ${name}`}
    >
      {portrait}
    </Link>
  ) : (
    portrait
  );

  if (!tooltip) {
    return linkedPortrait;
  }

  return (
    <Tooltip label={tooltip} withArrow {...tooltipProps}>
      {linkedPortrait}
    </Tooltip>
  );
}
