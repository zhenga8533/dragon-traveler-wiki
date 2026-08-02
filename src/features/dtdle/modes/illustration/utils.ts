import { resolveIllustrations, type Illustration } from '@/assets';
import type { Character } from '@/features/characters/types';
import { getEligibleCharacters } from '../../utils/daily-answer';
import { fnv1aHash32 } from '../../utils/ring-hash';

/** R+ characters with at least one declared skin scene. */
export function getIllustrationEligibleCharacters(
  characters: Character[],
): Character[] {
  return getEligibleCharacters(characters).filter((c) =>
    resolveIllustrations(c.name, c.slug, c.skins).some(
      (i) => i.type === 'image',
    ),
  );
}

export function getSceneIllustrations(character: Character): Illustration[] {
  return resolveIllustrations(
    character.name,
    character.slug,
    character.skins,
  ).filter((illustration) => illustration.type === 'image');
}

/** Deterministically gives every available skin scene a chance to be selected. */
export function pickDailyIllustration(
  character: Character,
  dateStr: string,
  scenes = getSceneIllustrations(character),
): Illustration | null {
  if (scenes.length === 0) return null;
  const orderedScenes = [...scenes].sort((left, right) =>
    (left.skinSlug ?? '').localeCompare(right.skinSlug ?? ''),
  );
  const hash = fnv1aHash32(`${dateStr}:illustration-skin:${character.slug}`);
  return orderedScenes[hash % orderedScenes.length];
}

/**
 * Deterministically picks where the initial zoomed-in crop is centered, so
 * the reveal doesn't always start dead-center on every character. Kept
 * within a 20-80% band on each axis to avoid framing pure background/edges.
 */
export function pickIllustrationFocusPoint(
  character: Character,
  dateStr: string,
): { x: number; y: number } {
  const xHash = fnv1aHash32(
    `${dateStr}:illustration-focus-x:${character.slug}`,
  );
  const yHash = fnv1aHash32(
    `${dateStr}:illustration-focus-y:${character.slug}`,
  );
  return {
    x: 20 + (xHash % 61),
    y: 20 + (yHash % 61),
  };
}
