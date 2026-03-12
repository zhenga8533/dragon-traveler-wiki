import { getPortrait } from '@/assets/character';
import { QUALITY_BORDER_COLOR } from '@/constants/colors';
import { getCharacterPortraitHoverProps } from '@/constants/styles';
import { getCharacterRoutePathByName } from '@/features/characters/utils/character-route';
import type { Quality } from '@/types/quality';
import { Image, Tooltip, type TooltipProps } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';

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
  routePath?: string;
  assetKey?: string;
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
  routePath,
  assetKey,
}: CharacterPortraitProps) {
  const routeAssetKey = routePath?.match(/^\/characters\/([^/?#]+)/)?.[1];
  const resolvedAssetKey = assetKey ?? routeAssetKey;
  const resolvedBorderColor =
    borderColor ??
    (quality ? QUALITY_BORDER_COLOR[quality] : 'var(--mantine-color-gray-5)');

  const portrait = (
    <Image
      src={getPortrait(name, resolvedAssetKey, quality)}
      alt={name}
      w={size}
      h={size}
      fit={fit}
      radius="50%"
      loading={loading}
      className={[
        getCharacterPortraitHoverProps({ isSubstitute }).className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...(borderWidth > 0
          ? {
              border: `${borderWidth}px solid ${resolvedBorderColor}`,
              borderRadius: '50%',
            }
          : {}),
        opacity: isSubstitute ? 0.9 : 1,
        ...style,
      }}
      fallbackSrc={
        fallbackSrc ??
        `https://placehold.co/${size}x${size}?text=${encodeURIComponent(name.charAt(0))}`
      }
    />
  );

  const linkedPortrait = link ? (
    <Link
      to={routePath ?? getCharacterRoutePathByName(name)}
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
