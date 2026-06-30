import { normalizeContentType } from '@/constants/content-types';
import type { CharacterClass } from '@/features/characters/types';
import { FACTION_NAME_TO_SLUG, FACTION_SLUGS } from '@/types/faction';
import type { FactionName, FactionSlug } from '@/types/faction';
import { toEntitySlug } from '@/utils/entity-slug';
import type { Team, TeamBenchMember, TeamMember, TeamMemberGroup } from '@/features/teams/types';
import { normalizeOptionalNote } from '@/utils/normalize-note';
import { toQuality } from '@/utils/quality';
import { isRecord } from '@/utils/type-guards';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  normalizeTeamBenchEntry,
} from '@/features/teams/utils/team-bench';

interface LegacyTeamMember {
  character_slug?: string;
  character_name?: string;
  character_quality?: TeamMember['character_quality'];
  overdrive_order?: number | null;
  note?: string;
  position?: TeamMember['position'];
}

/** Accepts both new (member_groups) and old (members/bench) wire formats. */
type TeamPatch = Partial<Omit<Team, 'member_groups'>> & {
  member_groups?: unknown[];
  // legacy flat fields
  members?: LegacyTeamMember[];
  bench?: unknown[];
};

export const MAX_ROSTER_SIZE = 6;
export const GRID_SIZE = 9; // 3×3 grid

export const ROW_COLORS = ['red', 'orange', 'blue'] as const;
export const ROW_STRIP_LABELS = ['Front', 'Middle', 'Back'] as const;
export const ROW_LABELS = [
  'the front row',
  'the middle row',
  'the back row',
] as const;
export const ROW_CLASS_HINTS = [
  'Guardian · Warrior · Assassin',
  'Warrior · Priest · Mage · Archer · Assassin',
  'Priest · Mage · Archer · Assassin',
] as const;

export function getValidRows(charClass: CharacterClass): number[] {
  switch (charClass) {
    case 'guardian':
      return [0];
    case 'warrior':
      return [0, 1];
    case 'assassin':
      return [0, 1, 2];
    case 'priest':
      return [1, 2];
    case 'mage':
      return [1, 2];
    case 'archer':
      return [1, 2];
    default:
      return [0, 1, 2];
  }
}

export function isTeamMemberLike(value: unknown): value is LegacyTeamMember {
  if (!isRecord(value)) {
    return false;
  }

  const hasSlug = typeof value.character_slug === 'string';
  const hasLegacyName = typeof value.character_name === 'string';
  if (!hasSlug && !hasLegacyName) {
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

function teamMemberIdentity(member: {
  character_slug: string;
  character_quality?: string | null;
}): string {
  return `${member.character_slug}__${member.character_quality ?? ''}`.toLowerCase();
}

export function getPastedTeamPatch(value: unknown): TeamPatch | null {
  if (Array.isArray(value)) {
    if (value.every(isTeamMemberLike)) {
      return { members: value };
    }

    if (value.length === 1 && isRecord(value[0])) {
      return value[0] as TeamPatch;
    }

    return null;
  }

  if (isRecord(value)) {
    return value as TeamPatch;
  }

  return null;
}

function normalizeMembersList(rawMembers: LegacyTeamMember[]): TeamMember[] {
  const seen = new Set<string>();
  const members: TeamMember[] = [];
  for (const member of rawMembers) {
    if (!isRecord(member)) continue;
    const slug =
      typeof member.character_slug === 'string'
        ? member.character_slug
        : typeof member.character_name === 'string'
          ? toEntitySlug(member.character_name as string)
          : null;
    if (!slug) continue;

    const normalizedQuality = toQuality(member.character_quality);
    const identity = `${slug}__${normalizedQuality ?? ''}`.toLowerCase();
    if (seen.has(identity)) continue;
    seen.add(identity);

    const position = member.position;
    const hasValidPosition =
      isRecord(position) &&
      typeof position.row === 'number' &&
      typeof position.col === 'number';
    const normalizedPosition = hasValidPosition
      ? { row: position.row as number, col: position.col as number }
      : null;
    const normalizedMemberNote = normalizeOptionalNote(member.note);

    members.push({
      character_slug: slug,
      ...(normalizedQuality ? { character_quality: normalizedQuality } : {}),
      overdrive_order:
        typeof member.overdrive_order === 'number'
          ? member.overdrive_order
          : null,
      ...(normalizedMemberNote ? { note: normalizedMemberNote } : {}),
      ...(normalizedPosition ? { position: normalizedPosition } : {}),
    });
  }
  return members;
}

function normalizeBenchList(
  rawBench: unknown[],
  memberNameSet: Set<string>
): TeamBenchMember[] {
  const seen = new Set<string>();
  const bench: TeamBenchMember[] = [];
  for (const rawBenchEntry of rawBench) {
    const benchEntry = normalizeTeamBenchEntry(rawBenchEntry);
    if (!benchEntry) continue;
    const benchName = getTeamBenchEntryName(benchEntry);
    if (memberNameSet.has(benchName)) continue;
    if (seen.has(benchName)) continue;
    seen.add(benchName);
    const normalizedBenchNote = getTeamBenchEntryNote(benchEntry);
    bench.push({
      ...benchEntry,
      ...(normalizedBenchNote ? { note: normalizedBenchNote } : {}),
    });
  }
  return bench;
}

function normalizeMemberGroup(raw: unknown): TeamMemberGroup | null {
  if (!isRecord(raw)) return null;
  const rawMembers = Array.isArray(raw.members) ? (raw.members as LegacyTeamMember[]) : [];
  const members = normalizeMembersList(rawMembers);
  const memberNameSet = new Set(
    members.map((m) => teamMemberIdentity(m).split('__', 1)[0])
  );
  const bench = Array.isArray(raw.bench)
    ? normalizeBenchList(raw.bench, memberNameSet)
    : undefined;
  return {
    label: typeof raw.label === 'string' ? raw.label : 'default',
    ...(typeof raw.description === 'string' && raw.description
      ? { description: raw.description }
      : {}),
    members,
    ...(bench && bench.length > 0 ? { bench } : {}),
  };
}

export function normalizeTeamFromPartial(
  partial: TeamPatch,
  fallback: Team
): Team {
  let normalizedGroups: TeamMemberGroup[];

  if (Array.isArray(partial.member_groups) && partial.member_groups.length > 0) {
    // New format
    normalizedGroups = partial.member_groups
      .map(normalizeMemberGroup)
      .filter((g): g is TeamMemberGroup => g !== null && g.members.length > 0);
    if (normalizedGroups.length === 0) normalizedGroups = fallback.member_groups;
  } else if (Array.isArray(partial.members)) {
    // Legacy flat format: wrap in a single group
    const members = normalizeMembersList(partial.members);
    const memberNameSet = new Set(
      members.map((m) => teamMemberIdentity(m).split('__', 1)[0])
    );
    const bench = Array.isArray(partial.bench)
      ? normalizeBenchList(partial.bench, memberNameSet)
      : undefined;
    normalizedGroups = [
      {
        label: 'default',
        members,
        ...(bench && bench.length > 0 ? { bench } : {}),
      },
    ];
  } else {
    normalizedGroups = fallback.member_groups;
  }

  const normalizedWyrmspells = isRecord(partial.wyrmspells)
    ? {
        ...(typeof partial.wyrmspells.breach === 'string'
          ? { breach: toEntitySlug(partial.wyrmspells.breach) }
          : {}),
        ...(typeof partial.wyrmspells.refuge === 'string'
          ? { refuge: toEntitySlug(partial.wyrmspells.refuge) }
          : {}),
        ...(typeof partial.wyrmspells.wildcry === 'string'
          ? { wildcry: toEntitySlug(partial.wyrmspells.wildcry) }
          : {}),
        ...(typeof partial.wyrmspells.dragons_call === 'string'
          ? { dragons_call: toEntitySlug(partial.wyrmspells.dragons_call) }
          : {}),
      }
    : fallback.wyrmspells;

  return {
    ...fallback,
    ...(typeof partial.name === 'string' ? { name: partial.name } : {}),
    ...(typeof partial.slug === 'string' ? { slug: partial.slug } : {}),
    ...(typeof partial.author === 'string' ? { author: partial.author } : {}),
    ...(typeof partial.description === 'string'
      ? { description: partial.description }
      : {}),
    content_type: normalizeContentType(
      partial.content_type,
      fallback.content_type
    ),
    faction: (() => {
      if (typeof partial.faction !== 'string') return fallback.faction;
      if (FACTION_SLUGS.includes(partial.faction as FactionSlug))
        return partial.faction as FactionSlug;
      return FACTION_NAME_TO_SLUG[partial.faction as FactionName] ?? fallback.faction;
    })(),
    member_groups: normalizedGroups,
    ...(normalizedWyrmspells ? { wyrmspells: normalizedWyrmspells } : {}),
    last_updated:
      typeof partial.last_updated === 'number'
        ? partial.last_updated
        : fallback.last_updated,
  };
}

export const TEAM_MIGRATION_FALLBACK: Team = {
  name: '',
  slug: '',
  author: '',
  content_type: 'All',
  description: '',
  faction: 'elemental_echo',
  member_groups: [{ label: 'default', members: [] }],
  last_updated: 0,
};

/** Migrates a stored team from any legacy format to the current schema. */
export function migrateStoredTeam(partial: Partial<Team>): Team {
  return normalizeTeamFromPartial(partial as TeamPatch, TEAM_MIGRATION_FALLBACK);
}

/** Returns the first group's members, or empty array if none. */
export function getFirstGroupMembers(team: Team): Team['member_groups'][0]['members'] {
  return team.member_groups[0]?.members ?? [];
}

/** Returns the first group's bench, or undefined if none. */
export function getFirstGroupBench(team: Team): Team['member_groups'][0]['bench'] {
  return team.member_groups[0]?.bench;
}
