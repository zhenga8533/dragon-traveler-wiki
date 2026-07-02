import { Group, Paper, Skeleton, UnstyledButton } from '@mantine/core';
import { useEffect, useReducer, useState } from 'react';
import { getIllustrations } from '@/assets';
import { getEventImage, placeholderEventImage } from '@/assets';
import SafeImage from '@/components/ui/SafeImage';

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

type IllustState = { srcs: string[]; idx: number; loading: boolean };
type IllustAction =
  | { type: 'reset' }
  | { type: 'loaded'; srcs: string[] }
  | { type: 'goTo'; idx: number }
  | { type: 'tick' };

function illustReducer(state: IllustState, action: IllustAction): IllustState {
  switch (action.type) {
    case 'reset':
      return { srcs: [], idx: 0, loading: true };
    case 'loaded':
      return { srcs: action.srcs, idx: 0, loading: false };
    case 'goTo':
      return { ...state, idx: action.idx };
    case 'tick':
      return { ...state, idx: state.srcs.length > 0 ? (state.idx + 1) % state.srcs.length : 0 };
  }
}

function useIllustration(characters: string[]): IllustrationState {
  const [{ srcs, idx, loading }, dispatch] = useReducer(illustReducer, {
    srcs: [],
    idx: 0,
    loading: true,
  });
  const charKey = characters.join(',');

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'reset' });
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
        dispatch({ type: 'loaded', srcs: results.filter((s): s is string => s !== null) });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [charKey, characters]);

  const sharedTick = useSharedBannerTick(srcs.length > 1);
  useEffect(() => {
    if (srcs.length <= 1) return;
    dispatch({ type: 'tick' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedTick]);

  return {
    src: srcs.length > 0 ? srcs[idx] : null,
    idx,
    total: srcs.length,
    loading,
    goTo: (i) => dispatch({ type: 'goTo', idx: i }),
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
    >
      {loading ? (
        <Skeleton height={height} radius={radius} />
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
