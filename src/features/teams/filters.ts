import { matchesContentTypeFilters } from '@/constants/content-types';
import type { FactionSlug } from '@/types/faction';
import type { Team } from './types';

export interface TeamFilters {
  [key: string]: string[];
  factions: FactionSlug[];
  contentTypes: string[];
}

export const EMPTY_TEAM_FILTERS: TeamFilters = {
  factions: [],
  contentTypes: [],
};

export function matchesTeamFilters(
  team: Team,
  search: string,
  filters: TeamFilters
): boolean {
  const query = search.trim().toLocaleLowerCase();
  return (
    (!query || team.name.toLocaleLowerCase().includes(query)) &&
    (filters.factions.length === 0 || filters.factions.includes(team.faction)) &&
    matchesContentTypeFilters(team.content_type, filters.contentTypes)
  );
}
