import {
  ActionIcon,
  Group,
  Select,
  Slider,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  LuPause,
  LuPlay,
  LuRefreshCw,
  LuRotate3D,
  LuScan,
} from 'react-icons/lu';
import { useSyncExternalStore } from 'react';
import type { AnimationProgressStore } from '../hooks/use-model-animation';
import type { ModelAnimation } from './character-model-metadata';

interface CharacterModelControlsProps {
  accent: string;
  animations: ModelAnimation[];
  selectedAnimation: string;
  paused: boolean;
  progressStore: AnimationProgressStore;
  onAnimationChange: (animation: string) => void;
  onPausedChange: (paused: boolean) => void;
  onReplay: () => void;
  onResetCamera: () => void;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00.00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.max(0, seconds - minutes * 60);
  return `${minutes}:${remainder.toFixed(2).padStart(5, '0')}`;
}

export default function CharacterModelControls({
  accent,
  animations,
  selectedAnimation,
  paused,
  progressStore,
  onAnimationChange,
  onPausedChange,
  onReplay,
  onResetCamera,
  onSeek,
}: CharacterModelControlsProps) {
  return (
    <Stack gap="xs" mb="sm">
      <Group justify="space-between" gap="sm">
        <Group gap={6} wrap="nowrap">
          <LuRotate3D aria-hidden size={13} />
          <Text c="dimmed" size="xs">
            Drag to rotate · Scroll to zoom
          </Text>
        </Group>
        <Group gap="xs" wrap="nowrap">
          {animations.length > 1 && (
            <Select
              aria-label="Model animation"
              data={animations.map((animation) => ({
                value: animation.name,
                label:
                  animation.role === 'overdrive'
                    ? `Overdrive · ${animation.label}`
                    : animation.label,
              }))}
              value={selectedAnimation}
              onChange={(value) => value && onAnimationChange(value)}
              size="xs"
              w={{ base: 145, sm: 190 }}
              allowDeselect={false}
            />
          )}
          <Tooltip label={paused ? 'Resume animation' : 'Pause animation'}>
            <ActionIcon
              aria-label={paused ? 'Resume animation' : 'Pause animation'}
              color={accent}
              onClick={() => onPausedChange(!paused)}
              variant="subtle"
            >
              {paused ? <LuPlay /> : <LuPause />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Replay animation">
            <ActionIcon
              aria-label="Replay animation"
              color={accent}
              onClick={onReplay}
              variant="subtle"
            >
              <LuRefreshCw />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reset camera">
            <ActionIcon
              aria-label="Reset model camera"
              color={accent}
              onClick={onResetCamera}
              variant="subtle"
            >
              <LuScan />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      <AnimationTimeline
        accent={accent}
        progressStore={progressStore}
        onSeek={onSeek}
      />
    </Stack>
  );
}

function AnimationTimeline({
  accent,
  progressStore,
  onSeek,
}: Pick<CharacterModelControlsProps, 'accent' | 'progressStore' | 'onSeek'>) {
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getSnapshot,
  );
  const hasProgress = progress.duration > 0;
  const sliderMaximum = hasProgress ? progress.duration : 1;

  return (
    <Group gap="xs" wrap="nowrap">
      <Text c="dimmed" ff="monospace" size="xs" w={48}>
        {formatTime(hasProgress ? progress.currentTime : 0)}
      </Text>
      <Slider
        aria-label="Animation position"
        color={accent}
        disabled={!hasProgress}
        label={(value) => formatTime(value)}
        max={sliderMaximum}
        min={0}
        onChange={onSeek}
        size="xs"
        step={0.01}
        value={hasProgress ? Math.min(progress.currentTime, sliderMaximum) : 0}
        flex={1}
      />
      <Text c="dimmed" ff="monospace" size="xs" ta="right" w={48}>
        {formatTime(hasProgress ? progress.duration : 0)}
      </Text>
    </Group>
  );
}
