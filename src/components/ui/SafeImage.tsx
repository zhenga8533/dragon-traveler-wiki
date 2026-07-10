import type { ImageProps } from '@mantine/core';
import { Image } from '@mantine/core';
import { useEffect, useState, type SyntheticEvent } from 'react';

export interface SafeImageProps extends ImageProps {
  alt?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
}

export default function SafeImage({
  src,
  alt,
  fallbackSrc,
  loading,
  onError,
  ...props
}: SafeImageProps) {
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    setDisplaySrc(src);
  }, [src]);

  if (!displaySrc) return null;

  return (
    <Image
      src={displaySrc}
      alt={alt}
      loading={loading}
      onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
        onError?.(event);
        if (fallbackSrc && displaySrc !== fallbackSrc) {
          setDisplaySrc(fallbackSrc);
          return;
        }
        setDisplaySrc(undefined);
      }}
      {...props}
    />
  );
}
