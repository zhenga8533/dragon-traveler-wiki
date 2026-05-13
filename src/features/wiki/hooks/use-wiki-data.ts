import type { Artifact } from '@/features/wiki/artifacts/types';
import type { GameEvent } from '@/features/wiki/events/types';
import type { Gear, GearSet } from '@/features/wiki/gear/types';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { Relic } from '@/features/wiki/relics/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import type { Wyrm } from '@/features/wiki/wyrms/types';
import { useDataFetch } from '@/hooks/use-data-fetch';
import type { Code } from '@/types/code';
import type { Resource } from '@/types/resource';
import type { StarTierData } from '@/types/star-level';
import type { UsefulLink } from '@/types/useful-link';

export function useWyrmspells() {
  return useDataFetch<Wyrmspell[]>('data/wyrmspells.json', []);
}

export function useStatusEffects() {
  return useDataFetch<StatusEffect[]>('data/status-effects.json', []);
}

export function useNoblePhantasms() {
  return useDataFetch<NoblePhantasm[]>('data/noble-phantasm.json', []);
}

export function useSubclasses() {
  return useDataFetch<Subclass[]>('data/subclasses.json', []);
}

export function useGear() {
  return useDataFetch<Gear[]>('data/gear.json', []);
}

export function useGearSets() {
  return useDataFetch<GearSet[]>('data/gear-sets.json', []);
}

export function useArtifacts() {
  return useDataFetch<Artifact[]>('data/artifacts.json', []);
}

export function useStarLevels() {
  return useDataFetch<StarTierData[]>('data/star-levels.json', []);
}

export function useWyrms() {
  return useDataFetch<Wyrm[]>('data/wyrms.json', []);
}

export function useHowlkins() {
  return useDataFetch<Howlkin[]>('data/howlkins.json', []);
}

export function useRelics() {
  return useDataFetch<Relic[]>('data/relic.json', []);
}

export function useEvents() {
  return useDataFetch<GameEvent[]>('data/events.json', []);
}

export function useCodes() {
  return useDataFetch<Code[]>('data/codes.json', []);
}

export function useResources() {
  return useDataFetch<Resource[]>('data/resources.json', []);
}

export function useUsefulLinks() {
  return useDataFetch<UsefulLink[]>('data/useful-links.json', []);
}
