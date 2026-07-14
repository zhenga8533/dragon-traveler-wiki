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
  className,
  onLoad,
  onError,
  ...props
}: SafeImageProps) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [isLoading, setIsLoading] = useState(Boolean(src));

  useEffect(() => {
    setDisplaySrc(src);
    setIsLoading(Boolean(src));
  }, [src]);

  if (!displaySrc) return null;

  return (
    <Image
      src={displaySrc}
      alt={alt}
      loading={loading}
      aria-busy={isLoading || undefined}
      className={[className, isLoading ? 'dt-safe-media--loading' : '']
        .filter(Boolean)
        .join(' ')}
      onLoad={(event: SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(false);
        onLoad?.(event);
      }}
      onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
        onError?.(event);
        if (fallbackSrc && displaySrc !== fallbackSrc) {
          setIsLoading(true);
          setDisplaySrc(fallbackSrc);
          return;
        }
        setIsLoading(false);
        setDisplaySrc(undefined);
      }}
      {...props}
    />
  );
}
