import { getPortrait } from '@/assets/character';
import { QUALITY_BORDER_COLOR } from '@/constants/colors';
import { getCharacterPortraitHoverProps } from '@/constants/styles';
import { CharacterOwnershipContext } from '@/contexts';
import { getCharacterIdentityKey, getCharacterRoutePathByName } from '@/features/characters/utils/character-route';
import type { Quality } from '@/types/quality';
import { Image, Tooltip, type TooltipProps } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useMobileTooltip } from '@/hooks';

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
  isNew?: boolean;
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
  isNew = false,
}: CharacterPortraitProps) {
  const mobileTooltip = useMobileTooltip();
  const { grayUnowned, isOwned } = useContext(CharacterOwnershipContext);
  const routeAssetKey = routePath?.match(/^\/characters\/([^/?#]+)/)?.[1];
  const resolvedAssetKey = assetKey ?? routeAssetKey;
  const resolvedBorderColor =
    borderColor ??
    (quality ? QUALITY_BORDER_COLOR[quality] : 'var(--mantine-color-gray-5)');

  // Only dim when quality is known — prevents misidentifying same-named characters of different quality
  const dimmed =
    grayUnowned && quality != null && !isOwned(getCharacterIdentityKey(name, quality));

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
        opacity: dimmed ? 0.35 : isSubstitute ? 0.9 : 1,
        filter: dimmed ? 'grayscale(1)' : undefined,
        transition: 'opacity 150ms ease, filter 150ms ease',
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

  const result = tooltip ? (
    <Tooltip label={tooltip} {...mobileTooltip} {...tooltipProps}>
      {linkedPortrait}
    </Tooltip>
  ) : (
    linkedPortrait
  );

  if (!isNew) return result;

  // Scale font and padding with portrait size
  const fontSize = Math.max(9, Math.round(size * 0.12));
  const padV = Math.max(1, Math.round(fontSize * 0.3));
  const padH = Math.max(3, Math.round(fontSize * 0.55));
  const badgeRadius = Math.max(3, Math.round(fontSize * 0.4));
  // 45° point on circle edge: distance from each side = size * (1 - 1/√2) / 2 ≈ size * 0.146
  // translate(-50%, -50%) centers the badge on that exact point
  const edge = Math.round(size * 0.146);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {result}
      <span
        style={{
          position: 'absolute',
          top: edge,
          right: edge,
          transform: 'translate(50%, -50%)',
          background: 'var(--mantine-color-green-6)',
          color: 'white',
          borderRadius: badgeRadius,
          fontSize,
          fontWeight: 700,
          lineHeight: 1,
          padding: `${padV}px ${padH}px`,
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          userSelect: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        New
      </span>
    </div>
  );
}
