import type { ChangesFile } from '@/types/changes';
import type { Team } from '@/features/teams/types';
import { useDataFetch } from '@/hooks/use-data-fetch';

export function useTeams() {
  return useDataFetch<Team[]>('data/teams.json', []);
}

export function useTeamChanges() {
  return useDataFetch<ChangesFile>('data/changes/teams.json', {});
}
