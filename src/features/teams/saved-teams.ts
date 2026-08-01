import { STORAGE_KEY } from '@/constants/ui';
import type { Team } from '@/features/teams/types';
import { migrateStoredTeam } from '@/features/teams/utils/team-builder';
import {
  deleteSavedFromStorage,
  getSavedFromStorage,
  hasSavedInStorage,
  loadSavedFromStorage,
  upsertSavedInStorage,
} from '@/utils/saved-storage';

const isSavedTeam = (value: Partial<Team>) => Array.isArray(value.members);

export function loadSavedTeams(): Team[] {
  return loadSavedFromStorage(
    STORAGE_KEY.TEAMS_MY_SAVED,
    isSavedTeam,
    migrateStoredTeam
  );
}

export function getSavedTeam(slug: string): Team | null {
  return getSavedFromStorage(slug, {
    storageKey: STORAGE_KEY.TEAMS_MY_SAVED,
    isValid: isSavedTeam,
    migrate: migrateStoredTeam,
  });
}

export function hasSavedTeam(slug: string): boolean {
  return hasSavedInStorage(STORAGE_KEY.TEAMS_MY_SAVED, slug);
}

export function saveTeam(slug: string, team: Team): void {
  upsertSavedInStorage(STORAGE_KEY.TEAMS_MY_SAVED, slug, team);
}

export function removeSavedTeam(slug: string): void {
  deleteSavedFromStorage(STORAGE_KEY.TEAMS_MY_SAVED, slug);
}
