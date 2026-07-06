import type { Character } from '@/features/characters/types';
import { getEligibleCharacters } from '../../utils/daily-answer';

/**
 * R+ characters with a usable quote, deduped by exact quote text (first
 * slug wins) so a same-quote rarity variant is never the picked answer.
 */
export function getQuoteEligibleCharacters(characters: Character[]): Character[] {
  const seenQuotes = new Set<string>();
  const result: Character[] = [];

  for (const character of getEligibleCharacters(characters)) {
    const quote = character.quote?.trim();
    if (!quote || seenQuotes.has(quote)) continue;
    seenQuotes.add(quote);
    result.push(character);
  }

  return result;
}
