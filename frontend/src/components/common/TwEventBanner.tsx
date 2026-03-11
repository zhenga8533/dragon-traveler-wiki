import { Group, Image, Paper, Skeleton, UnstyledButton } from '@mantine/core';
import { useEffect, useState } from 'react';
import { getIllustrations } from '../../assets/character';
import { placeholderEventImage } from '../../assets/event';

const INDICATOR_DOT_SIZE = 8;

interface TwIllustrationState {
  src: string | null;
  idx: number;
  total: number;
  loading: boolean;
  goTo: (i: number) => void;
}

function useTwIllustration(characters: string[]): TwIllustrationState {
  const [srcs, setSrcs] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const charKey = characters.join(',');

  useEffect(() => {
    let cancelled = false;
    setSrcs([]);
    setIdx(0);
    setLoading(true);
    Promise.all(
      characters.map(async (char) => {
        const list = await getIllustrations(char);
        const img =
          list.find(
            (il) => il.type === 'image' && il.name.toLowerCase() === 'default'
          ) ??
          list.find((il) => il.type === 'image') ??
          list[0];
        return img?.src ?? null;
      })
    ).then((results) => {
      if (!cancelled) {
        setSrcs(results.filter((s): s is string => s !== null));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [charKey, characters]);

  useEffect(() => {
    if (srcs.length <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % srcs.length), 3000);
    return () => clearInterval(timer);
  }, [srcs.length]);

  return {
    src: srcs.length > 0 ? srcs[idx] : null,
    idx,
    total: srcs.length,
    loading,
    goTo: setIdx,
  };
}

interface TwEventBannerProps {
  characters: string[];
  height: number;
  width?: number;
  radius?: string;
  visibleFrom?: 'sm' | 'md' | 'lg';
  alt?: string;
}

export default function TwEventBanner({
  characters,
  height,
  width,
  radius = 'md',
  visibleFrom,
  alt = '',
}: TwEventBannerProps) {
  const { src, idx, total, loading, goTo } = useTwIllustration(characters);

  return (
    <Paper
      radius={radius}
      style={{
        position: 'relative',
        overflow: 'hidden',
        flex: width ? `0 0 ${width}px` : undefined,
      }}
      visibleFrom={visibleFrom}
    >
      {loading ? (
        <Skeleton height={height} radius={radius} />
      ) : (
        <Image
          src={src ?? placeholderEventImage}
          h={height}
          w={width}
          radius={radius}
          fit="cover"
          alt={alt}
        />
      )}
      {total > 1 && (
        <Group
          gap={4}
          justify="center"
          style={{
            position: 'absolute',
            bottom: INDICATOR_DOT_SIZE,
            left: 0,
            right: 0,
          }}
        >
          {Array.from({ length: total }, (_, i) => (
            <UnstyledButton
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              style={{
                width: INDICATOR_DOT_SIZE,
                height: INDICATOR_DOT_SIZE,
                borderRadius: '50%',
                background: i === idx ? 'white' : 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(0,0,0,0.25)',
              }}
            />
          ))}
        </Group>
      )}
    </Paper>
  );
}
