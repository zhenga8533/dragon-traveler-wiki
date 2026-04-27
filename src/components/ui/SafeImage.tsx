import type { ImageProps } from '@mantine/core';
import { Image } from '@mantine/core';
import { useState } from 'react';

export interface SafeImageProps extends ImageProps {
  alt?: string;
  loading?: 'lazy' | 'eager';
}

export default function SafeImage({ src, alt, loading, ...props }: SafeImageProps) {
  const [error, setError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setError(false);
  }

  if (error || !src) return null;

  return <Image src={src} alt={alt} loading={loading} onError={() => setError(true)} {...props} />;
}
