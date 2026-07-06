import { getCharacterSkillIcon, getTalentIcon } from '@/assets';
import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import type { SkillType } from '@/features/characters/types';
import { useEffect, useMemo, useState } from 'react';
import { getAbilityEligibleCharacters, pickDailyAbility } from '../modes/ability/utils';
import { fnv1aHash32 } from '../utils/ring-hash';
import type { AbilityGameState } from '../modes/ability/types';
import { getTodayAnswerSlug, getTodayIsoDate } from '../utils/daily-answer';
import { useDailyGameState } from './use-daily-game-state';
import { useDailyStats } from './use-daily-stats';

const MODE_SALT = 'ability';

function isValidGameState(value: unknown): value is AbilityGameState {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Partial<AbilityGameState>;
  return (
    typeof v.date === 'string' &&
    Array.isArray(v.guessedSlugs) &&
    v.guessedSlugs.every((s) => typeof s === 'string') &&
    typeof v.characterSolved === 'boolean' &&
    Array.isArray(v.categoryGuesses) &&
    typeof v.solved === 'boolean'
  );
}

function freshState(date: string): AbilityGameState {
  return {
    date,
    guessedSlugs: [],
    characterSolved: false,
    categoryGuesses: [],
    solved: false,
  };
}

export function useAbilityGame() {
  const { data: characters, loading, error } = useCharacters();
  const todayStr = useMemo(() => getTodayIsoDate(), []);

  const eligible = useMemo(
    () => getAbilityEligibleCharacters(characters),
    [characters]
  );

  const answerCharacter = useMemo(() => {
    if (eligible.length === 0) return null;
    const sortedSlugs = eligible.map((c) => c.slug).sort();
    const answerSlug = getTodayAnswerSlug(todayStr, sortedSlugs, MODE_SALT);
    return eligible.find((c) => c.slug === answerSlug) ?? null;
  }, [eligible, todayStr]);

  const ability = useMemo(
    () => (answerCharacter ? pickDailyAbility(answerCharacter, todayStr) : null),
    [answerCharacter, todayStr]
  );

  const rotationDeg = useMemo(
    () =>
      ability
        ? fnv1aHash32(`${todayStr}:rotate:${ability.characterSlug}`) % 360
        : 0,
    [ability, todayStr]
  );

  const abilityKey = ability
    ? `${ability.characterSlug}:${ability.kind}:${ability.name}`
    : null;

  const [resolvedIcon, setResolvedIcon] = useState<{
    key: string;
    src: string | undefined;
  } | null>(null);

  useEffect(() => {
    if (!answerCharacter || !ability || !abilityKey) return;
    let cancelled = false;

    const resolve =
      ability.kind === 'talent'
        ? getTalentIcon(answerCharacter.name, answerCharacter.slug)
        : getCharacterSkillIcon(
            answerCharacter.name,
            ability.name,
            answerCharacter.slug
          );

    resolve.then((src) => {
      if (!cancelled) setResolvedIcon({ key: abilityKey, src });
    });

    return () => {
      cancelled = true;
    };
  }, [answerCharacter, ability, abilityKey]);

  const iconSrc =
    resolvedIcon && resolvedIcon.key === abilityKey
      ? resolvedIcon.src
      : undefined;

  const [gameState, setGameState] = useDailyGameState(
    STORAGE_KEY.DTDLE_ABILITY_STATE,
    todayStr,
    freshState,
    isValidGameState
  );

  const { stats, recordWin } = useDailyStats(
    STORAGE_KEY.DTDLE_ABILITY_STATS,
    todayStr
  );

  const guessedCharacters = useMemo(
    () =>
      gameState.guessedSlugs
        .map((slug) => eligible.find((c) => c.slug === slug))
        .filter((c): c is NonNullable<typeof c> => c != null),
    [gameState.guessedSlugs, eligible]
  );

  function submitCharacterGuess(slug: string) {
    if (
      !answerCharacter ||
      !ability ||
      gameState.characterSolved ||
      gameState.guessedSlugs.includes(slug)
    ) {
      return;
    }
    const isCorrect = slug === answerCharacter.slug;
    const characterSolved = gameState.characterSolved || isCorrect;
    // Talent abilities have no category to guess, so getting the character
    // right immediately completes the round.
    const solved = isCorrect && ability.kind === 'talent';

    setGameState((prev) => ({
      ...prev,
      guessedSlugs: [...prev.guessedSlugs, slug],
      characterSolved,
      solved: prev.solved || solved,
    }));

    if (solved) recordWin();
  }

  function submitCategoryGuess(type: SkillType) {
    if (
      !ability ||
      ability.kind !== 'skill' ||
      !gameState.characterSolved ||
      gameState.solved ||
      gameState.categoryGuesses.includes(type)
    ) {
      return;
    }
    const isCorrect = type === ability.skillType;
    setGameState((prev) => ({
      ...prev,
      categoryGuesses: [...prev.categoryGuesses, type],
      solved: prev.solved || isCorrect,
    }));

    if (isCorrect) recordWin();
  }

  return {
    loading,
    error,
    eligible,
    answerCharacter,
    ability,
    iconSrc,
    rotationDeg,
    gameState,
    stats,
    guessedCharacters,
    submitCharacterGuess,
    submitCategoryGuess,
  };
}
