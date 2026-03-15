import type { Artifact } from '@/features/wiki/artifacts/types';
import type { Gear, GearSet } from '@/features/wiki/gear/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { useDataFetch } from '@/hooks/use-data-fetch';

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
