import type { TeamPlaceholderMember } from '@/features/teams/types';
import { normalizeOptionalNote } from '@/utils/normalize-note';
import { toQuality } from '@/utils/quality';

export function isTeamPlaceholderMember(
  value: unknown
): value is TeamPlaceholderMember {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.character_name !== 'string') return false;

  if (
    record.note !== undefined &&
    record.note !== null &&
    typeof record.note !== 'string'
  ) {
    return false;
  }

  if (
    record.character_quality === undefined ||
    record.character_quality === null
  ) {
    return true;
  }

  return toQuality(record.character_quality) !== undefined;
}

export function getTeamPlaceholderEntryName(
  entry: TeamPlaceholderMember
): string {
  return entry.character_name;
}

export function getTeamPlaceholderEntryQuality(
  entry: TeamPlaceholderMember
): TeamPlaceholderMember['character_quality'] | undefined {
  return entry.character_quality;
}

export function getTeamPlaceholderEntryNote(
  entry: TeamPlaceholderMember
): TeamPlaceholderMember['note'] | undefined {
  return normalizeOptionalNote(entry.note);
}

export function normalizeTeamPlaceholderEntry(
  value: unknown
): TeamPlaceholderMember | null {
  if (typeof value === 'string') {
    return { character_name: value };
  }

  if (!isTeamPlaceholderMember(value)) {
    return null;
  }

  const normalizedQuality = toQuality(value.character_quality);
  const normalizedNote = normalizeOptionalNote(value.note);
  return {
    character_name: value.character_name,
    ...(normalizedQuality ? { character_quality: normalizedQuality } : {}),
    ...(normalizedNote ? { note: normalizedNote } : {}),
  };
}
