import { Group, Paper, Skeleton, UnstyledButton } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { resolveIllustrations } from '@/assets';
import { getEventImage, placeholderEventImage } from '@/assets';
import SafeImage from '@/components/ui/SafeImage';
import { buildCharacterByIdentityMap } from '@/features/characters/utils/character-route';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';

const INDICATOR_DOT_SIZE = 8;
const BANNER_TICK_MS = 3000;

// Module-level singleton so all banners rotate in lockstep.
let _tick = 0;
let _intervalId: ReturnType<typeof setInterval> | null = null;
const _subscribers = new Set<(t: number) => void>();

function _startTick() {
  if (_intervalId !== null) return;
  _intervalId = setInterval(() => {
    _tick += 1;
    _subscribers.forEach((cb) => cb(_tick));
  }, BANNER_TICK_MS);
}

function _stopTick() {
  if (_subscribers.size > 0 || _intervalId === null) return;
  clearInterval(_intervalId);
  _intervalId = null;
}

function useSharedBannerTick(enabled: boolean): number {
  const [localTick, setLocalTick] = useState(_tick);
  useEffect(() => {
    if (!enabled) return;
    _subscribers.add(setLocalTick);
    _startTick();
    return () => {
      _subscribers.delete(setLocalTick);
      _stopTick();
    };
  }, [enabled]);
  return localTick;
}

interface IllustrationState {
  src: string | null;
  idx: number;
  total: number;
  loading: boolean;
  goTo: (i: number) => void;
}

function useIllustration(characters: string[]): IllustrationState {
  const { data: characterData, loading } = useCharacters();
  const byIdentity = useMemo(
    () => buildCharacterByIdentityMap(characterData),
    [characterData],
  );

  const srcs = useMemo(() => {
    return characters
      .map((slug) => {
        const character = byIdentity.get(slug);
        const list = resolveIllustrations(slug, slug, character?.skins);
        const img =
          list.find((il) => il.type === 'image' && il.isDefault) ??
          list.find((il) => il.type === 'image') ??
          list[0];
        return img?.src ?? null;
      })
      .filter((s): s is string => s !== null);
  }, [characters, byIdentity]);

  const [srcsForIdx, setSrcsForIdx] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  if (srcs !== srcsForIdx) {
    setSrcsForIdx(srcs);
    setIdx(0);
  }

  const sharedTick = useSharedBannerTick(srcs.length > 1);
  const [tickForIdx, setTickForIdx] = useState(sharedTick);
  if (sharedTick !== tickForIdx) {
    setTickForIdx(sharedTick);
    if (srcs.length > 1) {
      setIdx((i) => (i + 1) % srcs.length);
    }
  }

  return {
    src: srcs.length > 0 ? srcs[idx] : null,
    idx,
    total: srcs.length,
    loading,
    goTo: setIdx,
  };
}

interface EventBannerProps {
  characters: string[];
  height: number;
  width?: number;
  radius?: string;
  visibleFrom?: 'sm' | 'md' | 'lg';
  alt?: string;
  eventName?: string;
}

export default function EventBanner({
  characters,
  height,
  width,
  radius = 'md',
  visibleFrom,
  alt = '',
  eventName,
}: EventBannerProps) {
  const { src, idx, total, loading, goTo } = useIllustration(characters);
  const namedImage = eventName ? getEventImage(eventName) : null;

  return (
    <Paper
      radius={radius}
      style={{
        position: 'relative',
        overflow: 'hidden',
        flex: width ? `0 0 ${width}px` : undefined,
      }}
      visibleFrom={visibleFrom}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <Skeleton height={height} radius={radius} aria-hidden="true" />
      ) : (
        <SafeImage
          src={src ?? namedImage ?? placeholderEventImage}
          fallbackSrc={placeholderEventImage}
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
              aria-label={`Show banner ${i + 1} of ${total}`}
              aria-current={i === idx ? 'true' : undefined}
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
