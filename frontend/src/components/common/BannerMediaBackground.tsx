import { Box } from '@mantine/core';
import type { CSSProperties } from 'react';
import { getHomeHeroPlaceholderGradient } from '../../constants/styles';
import { TRANSITION } from '../../constants/ui';

export interface BannerMedia {
  src: string;
  type: 'image' | 'video';
}

interface BannerMediaBackgroundProps {
  isDark: boolean;
  media: BannerMedia | null;
  loaded?: boolean;
  onLoaded?: () => void;
  style?: CSSProperties;
}

export default function BannerMediaBackground({
  isDark,
  media,
  loaded = true,
  onLoaded,
  style,
}: BannerMediaBackgroundProps) {
  const mediaOpacity = loaded ? 1 : 0;
  const mediaTransition = onLoaded
    ? `opacity ${TRANSITION.SLOW} ${TRANSITION.EASE}`
    : undefined;

  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: getHomeHeroPlaceholderGradient(isDark),
        }}
      />

      {media?.type === 'video' ? (
        <video
          src={media.src}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={onLoaded}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: mediaOpacity,
            transition: mediaTransition,
          }}
        />
      ) : media ? (
        <img
          src={media.src}
          alt=""
          fetchPriority="high"
          onLoad={onLoaded}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: mediaOpacity,
            transition: mediaTransition,
          }}
        />
      ) : null}

      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.35)',
        }}
      />

      <Box
        style={{
          position: 'absolute',
          width: 340,
          height: 340,
          top: -130,
          left: -80,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(236,72,153,0.32) 0%, rgba(236,72,153,0) 72%)',
          filter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      />

      <Box
        style={{
          position: 'absolute',
          width: 360,
          height: 360,
          bottom: -170,
          right: -90,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0) 74%)',
          filter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      />

      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, transparent 40%, var(--mantine-color-body) 100%)',
        }}
      />

      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, var(--mantine-color-body) 0%, transparent 10%, transparent 90%, var(--mantine-color-body) 100%)',
        }}
      />
    </Box>
  );
}
