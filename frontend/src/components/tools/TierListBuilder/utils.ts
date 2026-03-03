import { normalizeContentType } from '../../../constants/content-types';
import type { Quality } from '../../../types/quality';
import type { TierList } from '../../../types/tier-list';
import { toQuality } from '../../../utils/quality';

export const INPUT_COMMIT_DELAY_MS = 150;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isTierEntryLike(value: unknown): value is {
  character_name: string;
  character_quality?: Quality;
  tier: string;
  note?: string;
} {
  if (!isRecord(value)) return false;

  if (
    typeof value.character_name !== 'string' ||
    typeof value.tier !== 'string'
  ) {
    return false;
  }

  if (
    value.character_quality === undefined ||
    value.character_quality === null
  ) {
    return true;
  }

  return toQuality(value.character_quality) !== undefined;
}

export function normalizeNote(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getPastedTierListPatch(
  value: unknown
): Partial<TierList> | null {
  if (Array.isArray(value)) {
    if (value.every(isTierEntryLike)) {
      return { entries: value };
    }

    if (value.length === 1 && isRecord(value[0])) {
      return value[0] as Partial<TierList>;
    }

    return null;
  }

  if (isRecord(value)) {
    return value as Partial<TierList>;
  }

  return null;
}

export function normalizeTierListFromPartial(
  partial: Partial<TierList>,
  fallback: TierList
): TierList {
  const getEntryIdentity = (entry: {
    character_name: string;
    character_quality?: string;
  }): string => {
    return `${entry.character_name}__${entry.character_quality ?? ''}`.toLowerCase();
  };

  const normalizedTiers = Array.isArray(partial.tiers)
    ? partial.tiers
        .filter(
          (tierDef) => isRecord(tierDef) && typeof tierDef.name === 'string'
        )
        .map((tierDef) => {
          const normalizedTierNote = normalizeNote(tierDef.note);
          return {
            name: tierDef.name,
            ...(normalizedTierNote ? { note: normalizedTierNote } : {}),
          };
        })
    : fallback.tiers;

  const normalizedEntries = Array.isArray(partial.entries)
    ? (() => {
        const seenCharacters = new Set<string>();
        const entries: TierList['entries'] = [];
        for (const entry of partial.entries) {
          if (!isTierEntryLike(entry)) continue;
          const identity = getEntryIdentity(entry);
          if (seenCharacters.has(identity)) continue;
          seenCharacters.add(identity);
          const normalizedEntryNote = normalizeNote(entry.note);
          const normalizedQuality = toQuality(entry.character_quality);
          entries.push({
            character_name: entry.character_name,
            ...(normalizedQuality
              ? { character_quality: normalizedQuality }
              : {}),
            tier: entry.tier,
            ...(normalizedEntryNote ? { note: normalizedEntryNote } : {}),
          });
        }
        return entries;
      })()
    : fallback.entries;

  return {
    ...fallback,
    ...(typeof partial.name === 'string' ? { name: partial.name } : {}),
    ...(typeof partial.author === 'string' ? { author: partial.author } : {}),
    ...(typeof partial.description === 'string'
      ? { description: partial.description }
      : {}),
    content_type: normalizeContentType(
      partial.content_type,
      fallback.content_type
    ),
    ...(normalizedTiers ? { tiers: normalizedTiers } : {}),
    entries: normalizedEntries,
    last_updated:
      typeof partial.last_updated === 'number'
        ? partial.last_updated
        : fallback.last_updated,
  };
}
