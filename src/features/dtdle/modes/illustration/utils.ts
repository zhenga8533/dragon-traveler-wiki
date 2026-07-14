import { resolveIllustrations, type Illustration } from '@/assets';
import type { Character } from '@/features/characters/types';
import { getEligibleCharacters } from '../../utils/daily-answer';
import { fnv1aHash32 } from '../../utils/ring-hash';

/** R+ characters with at least one image-type illustration (currently all of them). */
export function getIllustrationEligibleCharacters(
  characters: Character[]
): Character[] {
  return getEligibleCharacters(characters).filter((c) =>
    resolveIllustrations(c.name, c.slug, c.skins).some(
      (i) => i.type === 'image'
    )
  );
}

export function pickDailyIllustration(character: Character): Illustration | null {
  const illustrations = resolveIllustrations(
    character.name,
    character.slug,
    character.skins
  );
  return illustrations.find((i) => i.type === 'image') ?? null;
}

/**
 * Deterministically picks where the initial zoomed-in crop is centered, so
 * the reveal doesn't always start dead-center on every character. Kept
 * within a 20-80% band on each axis to avoid framing pure background/edges.
 */
export function pickIllustrationFocusPoint(
  character: Character,
  dateStr: string
): { x: number; y: number } {
  const xHash = fnv1aHash32(`${dateStr}:illustration-focus-x:${character.slug}`);
  const yHash = fnv1aHash32(`${dateStr}:illustration-focus-y:${character.slug}`);
  return {
    x: 20 + (xHash % 61),
    y: 20 + (yHash % 61),
  };
}
