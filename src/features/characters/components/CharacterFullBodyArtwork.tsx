import { Box, Container } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import { BREAKPOINTS } from '@/constants/ui';

interface CharacterFullBodyArtworkProps {
  src: string;
}

/**
 * Smoothly scale differently shaped canvases without breakpoint-like jumps.
 * The bounded curve keeps unusually tall and wide source images within a
 * useful visual range while giving narrow character art more presence.
 */
function getArtworkHeight(aspectRatio: number): number {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return 140;
  return 90 + 140 / (1 + Math.pow(aspectRatio / 0.75, 2));
}

export default function CharacterFullBodyArtwork({
  src,
}: CharacterFullBodyArtworkProps) {
  const isWideEnough = useMediaQuery(BREAKPOINTS.MD);
  const [measurement, setMeasurement] = useState<{
    src: string;
    height: number;
  } | null>(null);
  const height =
    measurement && measurement.src === src ? measurement.height : null;

  if (!isWideEnough) return null;

  return (
    <Container
      size="lg"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          right: 'clamp(16px, 2vw, 32px)',
          bottom: 0,
          width: '40%',
          height: 'calc(100% - 32px)',
          maskImage:
            'linear-gradient(to right, transparent 0%, black 24%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 24%, black 100%)',
        }}
      >
        <SafeImage
          src={src}
          alt=""
          loading="eager"
          onLoad={(event) => {
            const image = event.currentTarget;
            setMeasurement({
              src,
              height: getArtworkHeight(image.naturalWidth / image.naturalHeight),
            });
          }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 'auto',
            maxWidth: 'none',
            height: `${height ?? 140}%`,
            opacity: height == null ? 0 : 1,
            transition: 'opacity 160ms ease',
            maskImage:
              'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
          }}
        />
      </Box>
    </Container>
  );
}
