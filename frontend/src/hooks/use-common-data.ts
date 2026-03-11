import type { Artifact } from '@/features/wiki/types/artifact';
import type { ChangesFile } from '@/types/changes';
import type { Character } from '@/features/characters/types';
import type { Faction } from '@/types/faction';
import type { Gear, GearSet } from '@/features/wiki/types/gear';
import type { NoblePhantasm } from '@/features/wiki/types/noble-phantasm';
import type { StatusEffect } from '@/features/wiki/types/status-effect';
import type { Subclass } from '@/features/wiki/types/subclass';
import type { Team } from '@/features/teams/types';
import type { TierList } from '@/features/teams/tier-list-types';
import type { Wyrmspell } from '@/features/wiki/types/wyrmspell';
import { useDataFetch } from './use-data-fetch';

export function useCharacters() {
  return useDataFetch<Character[]>('data/characters.json', []);
}

export function useTeams() {
  return useDataFetch<Team[]>('data/teams.json', []);
}

export function useWyrmspells() {
  return useDataFetch<Wyrmspell[]>('data/wyrmspells.json', []);
}

export function useStatusEffects() {
  return useDataFetch<StatusEffect[]>('data/status-effects.json', []);
}

export function useNoblePhantasms() {
  return useDataFetch<NoblePhantasm[]>('data/noble_phantasm.json', []);
}

export function useSubclasses() {
  return useDataFetch<Subclass[]>('data/subclasses.json', []);
}

export function useGear() {
  return useDataFetch<Gear[]>('data/gear.json', []);
}

export function useGearSets() {
  return useDataFetch<GearSet[]>('data/gear_sets.json', []);
}

export function useArtifacts() {
  return useDataFetch<Artifact[]>('data/artifacts.json', []);
}

export function useFactions() {
  return useDataFetch<Faction[]>('data/factions.json', []);
}

export function useTierLists() {
  return useDataFetch<TierList[]>('data/tier-lists.json', []);
}

export function useCharacterChanges() {
  return useDataFetch<ChangesFile>('data/changes/characters.json', {});
}

export function useTeamChanges() {
  return useDataFetch<ChangesFile>('data/changes/teams.json', {});
}

export function useTierListChanges() {
  return useDataFetch<ChangesFile>('data/changes/tier-lists.json', {});
}
