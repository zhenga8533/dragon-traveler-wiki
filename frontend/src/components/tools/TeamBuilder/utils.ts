import { normalizeContentType } from '../../../constants/content-types';
import type { CharacterClass } from '../../../types/character';
import type { FactionName } from '../../../types/faction';
import type { Team, TeamMember } from '../../../types/team';

export const MAX_ROSTER_SIZE = 6;
export const GRID_SIZE = 9; // 3×3 grid

export const ROW_COLORS = ['red', 'orange', 'blue'] as const;
export const ROW_STRIP_LABELS = ['Front', 'Middle', 'Back'] as const;
export const ROW_LABELS = ['the front row', 'the middle row', 'the back row'] as const;
export const ROW_CLASS_HINTS = [
  'Guardian · Warrior · Assassin',
  'Warrior · Priest · Mage · Archer · Assassin',
  'Priest · Mage · Archer · Assassin',
] as const;

export const INPUT_COMMIT_DELAY_MS = 150;

export function getValidRows(charClass: CharacterClass): number[] {
  switch (charClass) {
    case 'Guardian':
      return [0];
    case 'Warrior':
      return [0, 1];
    case 'Assassin':
      return [0, 1, 2];
    case 'Priest':
      return [1, 2];
    case 'Mage':
      return [1, 2];
    case 'Archer':
      return [1, 2];
    default:
      return [0, 1, 2];
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isTeamMemberLike(value: unknown): value is TeamMember {
  return isRecord(value) && typeof value.character_name === 'string';
}

export function normalizeNote(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getPastedTeamPatch(value: unknown): Partial<Team> | null {
  if (Array.isArray(value)) {
    if (value.every(isTeamMemberLike)) {
      return { members: value };
    }

    if (value.length === 1 && isRecord(value[0])) {
      return value[0] as Partial<Team>;
    }

    return null;
  }

  if (isRecord(value)) {
    return value as Partial<Team>;
  }

  return null;
}

export function normalizeTeamFromPartial(
  partial: Partial<Team>,
  fallback: Team
): Team {
  const normalizedMembers = Array.isArray(partial.members)
    ? (() => {
        const seen = new Set<string>();
        const members: TeamMember[] = [];
        for (const member of partial.members) {
          if (!isTeamMemberLike(member)) continue;
          if (seen.has(member.character_name)) continue;
          seen.add(member.character_name);

          const hasValidPosition =
            typeof member.position?.row === 'number' &&
            typeof member.position?.col === 'number';
          const normalizedMemberNote = normalizeNote(member.note);

          members.push({
            character_name: member.character_name,
            overdrive_order:
              typeof member.overdrive_order === 'number'
                ? member.overdrive_order
                : null,
            ...(normalizedMemberNote ? { note: normalizedMemberNote } : {}),
            ...(hasValidPosition
              ? {
                  position: {
                    row: member.position!.row,
                    col: member.position!.col,
                  },
                }
              : {}),
          });
        }
        return members;
      })()
    : fallback.members;

  const normalizedMemberNameSet = new Set(
    normalizedMembers.map((member) => member.character_name)
  );

  const normalizedBench = Array.isArray(partial.bench)
    ? (() => {
        const seen = new Set<string>();
        const bench: string[] = [];
        for (const benchName of partial.bench) {
          if (typeof benchName !== 'string') continue;
          if (normalizedMemberNameSet.has(benchName)) continue;
          if (seen.has(benchName)) continue;
          seen.add(benchName);
          bench.push(benchName);
        }
        return bench;
      })()
    : fallback.bench;

  const normalizedBenchNameSet = new Set(normalizedBench);

  const normalizedBenchNotes = isRecord(partial.bench_notes)
    ? Object.fromEntries(
        Object.entries(partial.bench_notes)
          .filter((entry): entry is [string, string] => {
            const [characterName, note] = entry;
            return (
              typeof characterName === 'string' && typeof note === 'string'
            );
          })
          .map(
            ([characterName, note]) =>
              [characterName, normalizeNote(note)] as const
          )
          .filter((entry): entry is readonly [string, string] => {
            const [characterName, note] = entry;
            return normalizedBenchNameSet.has(characterName) && Boolean(note);
          })
      )
    : fallback.bench_notes;

  const normalizedWyrmspells = isRecord(partial.wyrmspells)
    ? {
        ...(typeof partial.wyrmspells.breach === 'string'
          ? { breach: partial.wyrmspells.breach }
          : {}),
        ...(typeof partial.wyrmspells.refuge === 'string'
          ? { refuge: partial.wyrmspells.refuge }
          : {}),
        ...(typeof partial.wyrmspells.wildcry === 'string'
          ? { wildcry: partial.wyrmspells.wildcry }
          : {}),
        ...(typeof partial.wyrmspells.dragons_call === 'string'
          ? { dragons_call: partial.wyrmspells.dragons_call }
          : {}),
      }
    : fallback.wyrmspells;

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
    faction:
      typeof partial.faction === 'string'
        ? (partial.faction as FactionName)
        : fallback.faction,
    members: normalizedMembers,
    ...(normalizedBench ? { bench: normalizedBench } : {}),
    ...(normalizedBenchNotes ? { bench_notes: normalizedBenchNotes } : {}),
    ...(normalizedWyrmspells ? { wyrmspells: normalizedWyrmspells } : {}),
    last_updated:
      typeof partial.last_updated === 'number'
        ? partial.last_updated
        : fallback.last_updated,
  };
}
