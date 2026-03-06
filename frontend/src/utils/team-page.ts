import type { RefObject } from 'react';
import type { Team } from '../types/team';
import { downloadElementAsPng } from './export-image';

export function hasTeamWyrmspells(team: Team): boolean {
  const spells = team.wyrmspells;
  if (!spells) return false;

  return Boolean(
    spells.breach || spells.refuge || spells.wildcry || spells.dragons_call
  );
}

export function hasTeamBuilderDraft(storageKey: string): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(storageKey));
}

export async function exportTeamCompositionAsImage(
  exportRef: RefObject<HTMLDivElement | null>,
  teamName: string,
  isDark: boolean
): Promise<void> {
  if (!exportRef.current) return;
  await downloadElementAsPng(exportRef.current, teamName, isDark);
}
