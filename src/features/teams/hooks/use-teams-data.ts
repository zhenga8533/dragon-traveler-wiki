import type { ChangesFile } from '@/types/changes';
import type { Team } from '@/features/teams/types';
import { useLocalePath, useLocaleChangesPath } from '@/hooks/use-locale-path';
import { useDataFetch } from '@/hooks/use-data-fetch';
import { parseObjectArray, parseObjectRecord } from '@/utils/data-validation';

export function useTeams() {
  const path = useLocalePath('teams.json');
  return useDataFetch<Team[]>(path, [], parseObjectArray<Team>);
}

export function useTeamChanges() {
  const path = useLocaleChangesPath('teams.json');
  return useDataFetch<ChangesFile>(
    path,
    {},
    parseObjectRecord<ChangesFile[string]>,
  );
}
