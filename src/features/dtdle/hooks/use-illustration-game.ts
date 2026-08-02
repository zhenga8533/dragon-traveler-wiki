import { STORAGE_KEY } from '@/constants/ui';
import { resolveManifestIllustrations } from '@/assets';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useAssetManifest } from '@/hooks/use-asset-manifest';
import { useMemo } from 'react';
import {
  getIllustrationEligibleCharacters,
  getSceneIllustrations,
  pickDailyIllustration,
  pickIllustrationFocusPoint,
} from '../modes/illustration/utils';
import { useDailyAnswer } from './use-daily-answer';
import { useDailyGameState } from './use-daily-game-state';
import { useDailyStats } from './use-daily-stats';
import { useGuessedCharacters } from './use-guessed-characters';
import { useTodayIsoDate } from './use-today-iso-date';
import type { IllustrationGameState } from '../types';

const MODE_SALT = 'illustration';
const ZOOM_STEPS = [6, 4.5, 3, 2, 1.4, 1];

function isValidGameState(value: unknown): value is IllustrationGameState {
  if (value === null || typeof value !== 'object') return false;
  const state = value as Partial<IllustrationGameState>;
  return (
    typeof state.date === 'string' &&
    Array.isArray(state.guessedSlugs) &&
    state.guessedSlugs.every((slug) => typeof slug === 'string') &&
    typeof state.characterSolved === 'boolean' &&
    Array.isArray(state.guessedSkinSlugs) &&
    state.guessedSkinSlugs.every((slug) => typeof slug === 'string') &&
    typeof state.solved === 'boolean'
  );
}

function freshGameState(date: string): IllustrationGameState {
  return {
    date,
    guessedSlugs: [],
    characterSolved: false,
    guessedSkinSlugs: [],
    solved: false,
  };
}

export function useIllustrationGame() {
  const { data: characters, loading, error, retry } = useCharacters();
  const assetManifest = useAssetManifest();
  const todayStr = useTodayIsoDate();

  const eligible = useMemo(() => {
    const declared = getIllustrationEligibleCharacters(characters);
    if (assetManifest.error) return declared;
    return declared.filter((character) =>
      resolveManifestIllustrations(
        getSceneIllustrations(character),
        assetManifest.data.assets,
      ).some((scene) => scene.type === 'image'),
    );
  }, [assetManifest.data.assets, assetManifest.error, characters]);

  const answer = useDailyAnswer(eligible, todayStr, MODE_SALT);

  const availableScenes = useMemo(() => {
    if (!answer) return [];
    const scenes = getSceneIllustrations(answer);
    return assetManifest.error
      ? scenes
      : resolveManifestIllustrations(scenes, assetManifest.data.assets);
  }, [answer, assetManifest.data.assets, assetManifest.error]);

  const illustration = useMemo(
    () =>
      answer ? pickDailyIllustration(answer, todayStr, availableScenes) : null,
    [answer, availableScenes, todayStr],
  );

  const focusPoint = useMemo(
    () =>
      answer ? pickIllustrationFocusPoint(answer, todayStr) : { x: 50, y: 50 },
    [answer, todayStr],
  );

  const [gameState, setGameState] = useDailyGameState(
    STORAGE_KEY.DTDLE_ILLUSTRATION_STATE,
    todayStr,
    freshGameState,
    isValidGameState,
  );

  const { stats, recordWin } = useDailyStats(
    STORAGE_KEY.DTDLE_ILLUSTRATION_STATS,
    todayStr,
  );

  const wrongGuessCount = gameState.characterSolved
    ? 0
    : gameState.guessedSlugs.length;
  const zoomScale =
    ZOOM_STEPS[Math.min(wrongGuessCount, ZOOM_STEPS.length - 1)];

  const guessedCharacters = useGuessedCharacters(
    eligible,
    gameState.guessedSlugs,
  );

  function submitCharacterGuess(slug: string) {
    if (!answer) return;
    setGameState((previous) => {
      if (previous.characterSolved || previous.guessedSlugs.includes(slug)) {
        return previous;
      }
      return {
        ...previous,
        guessedSlugs: [...previous.guessedSlugs, slug],
        characterSolved: slug === answer.slug,
      };
    });
  }

  function submitSkinGuess(skinSlug: string) {
    if (
      !illustration?.skinSlug ||
      !gameState.characterSolved ||
      gameState.solved ||
      gameState.guessedSkinSlugs.includes(skinSlug)
    ) {
      return;
    }
    setGameState((previous) => {
      if (
        !previous.characterSolved ||
        previous.solved ||
        previous.guessedSkinSlugs.includes(skinSlug)
      ) {
        return previous;
      }
      const isCorrect = skinSlug === illustration.skinSlug;
      return {
        ...previous,
        guessedSkinSlugs: [...previous.guessedSkinSlugs, skinSlug],
        solved: isCorrect,
      };
    });
    if (skinSlug === illustration.skinSlug) recordWin();
  }

  return {
    loading: loading || assetManifest.loading,
    error,
    retry,
    eligible,
    answer,
    illustration,
    zoomScale,
    focusPoint,
    gameState,
    stats,
    guessedCharacters,
    availableScenes,
    submitCharacterGuess,
    submitSkinGuess,
  };
}
