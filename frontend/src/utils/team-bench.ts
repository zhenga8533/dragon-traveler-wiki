import type { TeamBenchMember } from '../types/team';
import { toQuality } from './quality';

function normalizeBenchNote(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isTeamBenchMember(value: unknown): value is TeamBenchMember {
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

export function getTeamBenchEntryName(entry: TeamBenchMember): string {
  return entry.character_name;
}

export function getTeamBenchEntryQuality(
  entry: TeamBenchMember
): TeamBenchMember['character_quality'] | undefined {
  return entry.character_quality;
}

export function getTeamBenchEntryNote(
  entry: TeamBenchMember
): TeamBenchMember['note'] | undefined {
  return normalizeBenchNote(entry.note);
}

export function normalizeTeamBenchEntry(
  value: unknown
): TeamBenchMember | null {
  if (typeof value === 'string') {
    return { character_name: value };
  }

  if (!isTeamBenchMember(value)) {
    return null;
  }

  const normalizedQuality = toQuality(value.character_quality);
  const normalizedNote = normalizeBenchNote(value.note);
  return {
    character_name: value.character_name,
    ...(normalizedQuality ? { character_quality: normalizedQuality } : {}),
    ...(normalizedNote ? { note: normalizedNote } : {}),
  };
}
