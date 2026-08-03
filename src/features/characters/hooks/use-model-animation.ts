import { useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import {
  LoopOnce,
  LoopRepeat,
  type AnimationAction,
  type AnimationClip,
  type Object3D,
} from 'three';
import type { ModelAnimation } from '../components/character-model-metadata';

const ANIMATION_BLEND_DURATION = 0.25;

export interface AnimationProgress {
  currentTime: number;
  duration: number;
}

export interface AnimationSeekRequest {
  time: number;
}

export interface AnimationProgressStore {
  getSnapshot: () => AnimationProgress;
  publish: (progress: AnimationProgress) => void;
  reset: () => void;
  seek: (time: number) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createAnimationProgressStore(): AnimationProgressStore {
  let snapshot: AnimationProgress = { currentTime: 0, duration: 0 };
  const listeners = new Set<() => void>();
  const publish = (progress: AnimationProgress) => {
    if (
      snapshot.currentTime === progress.currentTime &&
      snapshot.duration === progress.duration
    )
      return;
    snapshot = progress;
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    publish,
    reset: () => publish({ currentTime: 0, duration: 0 }),
    seek: (time) => publish({ ...snapshot, currentTime: time }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

interface UseModelAnimationOptions {
  clips: AnimationClip[];
  root: Object3D;
  animations: ModelAnimation[];
  selectedAnimation: string;
  animationRun: number;
  paused: boolean;
  seekRequest: AnimationSeekRequest | null;
  onFinished: () => void;
  onProgress: (progress: AnimationProgress) => void;
}

export function useModelAnimation({
  clips,
  root,
  animations,
  selectedAnimation,
  animationRun,
  paused,
  seekRequest,
  onFinished,
  onProgress,
}: UseModelAnimationOptions) {
  const { actions, mixer } = useAnimations(clips, root);
  const activeAction = actions[selectedAnimation];
  const lastProgressUpdate = useRef(0);

  useEffect(() => {
    const definition = animations.find(
      (animation) => animation.name === selectedAnimation,
    );
    if (!definition || !activeAction) return;

    activeAction.reset();
    activeAction.setLoop(
      definition.loop ? LoopRepeat : LoopOnce,
      definition.loop ? Infinity : 1,
    );
    // Three.js exposes final-pose clamping as mutable AnimationAction state.
    // eslint-disable-next-line react-hooks/immutability
    activeAction.clampWhenFinished = !definition.loop;
    activeAction.fadeIn(ANIMATION_BLEND_DURATION).play();
    onProgress({
      currentTime: 0,
      duration: activeAction.getClip().duration,
    });

    const handleFinished = (event: { action: AnimationAction }) => {
      if (event.action === activeAction) onFinished();
    };
    mixer.addEventListener('finished', handleFinished);
    return () => {
      mixer.removeEventListener('finished', handleFinished);
      activeAction.fadeOut(ANIMATION_BLEND_DURATION);
    };
  }, [
    activeAction,
    animationRun,
    animations,
    mixer,
    onFinished,
    onProgress,
    selectedAnimation,
  ]);

  useEffect(() => {
    activeAction?.setEffectiveTimeScale(paused ? 0 : 1);
    return () => {
      activeAction?.setEffectiveTimeScale(1);
    };
  }, [activeAction, paused]);

  useEffect(() => {
    if (!activeAction || !seekRequest) return;
    const duration = activeAction.getClip().duration;
    // AnimationAction has no setter for seeking; Three.js exposes its clock as mutable state.
    // eslint-disable-next-line react-hooks/immutability
    activeAction.time = Math.min(Math.max(seekRequest.time, 0), duration);
    onProgress({ currentTime: activeAction.time, duration });
  }, [activeAction, onProgress, seekRequest]);

  useFrame(({ clock }) => {
    if (
      !activeAction ||
      clock.elapsedTime - lastProgressUpdate.current < 1 / 30
    )
      return;
    lastProgressUpdate.current = clock.elapsedTime;
    onProgress({
      currentTime: activeAction.time,
      duration: activeAction.getClip().duration,
    });
  });
}
