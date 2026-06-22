import type { Artifact } from '@/features/wiki/artifacts/types';
import type { GameEvent } from '@/features/wiki/events/types';
import type { Gear, GearSet } from '@/features/wiki/gear/types';
import type { GoldenAlliance, Howlkin } from '@/features/wiki/howlkins/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { Relic } from '@/features/wiki/relics/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import type { Wyrm } from '@/features/wiki/wyrms/types';
import { useLocalePath, useLocaleChangesPath } from '@/hooks/use-locale-path';
import { useDataFetch } from '@/hooks/use-data-fetch';
import type { ChangelogEntry } from '@/types/changelog';
import type { ChangesFile } from '@/types/changes';
import type { Code } from '@/types/code';
import type { Resource } from '@/types/resource';
import type { StarTierData } from '@/types/star-level';
import type { UsefulLink } from '@/types/useful-link';

export function useWyrmspells() {
  const path = useLocalePath('wyrmspells.json');
  return useDataFetch<Wyrmspell[]>(path, []);
}

export function useStatusEffects() {
  const path = useLocalePath('status-effects.json');
  return useDataFetch<StatusEffect[]>(path, []);
}

export function useNoblePhantasms() {
  const path = useLocalePath('noble-phantasm.json');
  return useDataFetch<NoblePhantasm[]>(path, []);
}

export function useSubclasses() {
  const path = useLocalePath('subclasses.json');
  return useDataFetch<Subclass[]>(path, []);
}

export function useGear() {
  const path = useLocalePath('gear.json');
  return useDataFetch<Gear[]>(path, []);
}

export function useGearSets() {
  const path = useLocalePath('gear-sets.json');
  return useDataFetch<GearSet[]>(path, []);
}

export function useArtifacts() {
  const path = useLocalePath('artifacts.json');
  return useDataFetch<Artifact[]>(path, []);
}

export function useStarLevels() {
  const path = useLocalePath('star-levels.json');
  return useDataFetch<StarTierData[]>(path, []);
}

export function useWyrms() {
  const path = useLocalePath('wyrms.json');
  return useDataFetch<Wyrm[]>(path, []);
}

export function useHowlkins() {
  const path = useLocalePath('howlkins.json');
  return useDataFetch<Howlkin[]>(path, []);
}

export function useGoldenAlliances() {
  const path = useLocalePath('golden-alliances.json');
  return useDataFetch<GoldenAlliance[]>(path, []);
}

export function useRelics() {
  const path = useLocalePath('relic.json');
  return useDataFetch<Relic[]>(path, []);
}

export function useEvents() {
  const path = useLocalePath('events.json');
  return useDataFetch<GameEvent[]>(path, []);
}

export function useCodes() {
  const path = useLocalePath('codes.json');
  return useDataFetch<Code[]>(path, []);
}

export function useResources() {
  const path = useLocalePath('resources.json');
  return useDataFetch<Resource[]>(path, []);
}

export function useUsefulLinks() {
  const path = useLocalePath('useful-links.json');
  return useDataFetch<UsefulLink[]>(path, []);
}

export function useChangelog() {
  const path = useLocalePath('changelog.json');
  return useDataFetch<ChangelogEntry[]>(path, []);
}

// Change-history hooks

export function useArtifactChanges() {
  const path = useLocaleChangesPath('artifacts.json');
  return useDataFetch<ChangesFile>(path, {});
}

export function useWyrmChanges() {
  const path = useLocaleChangesPath('wyrms.json');
  return useDataFetch<ChangesFile>(path, {});
}

export function useWyrmspellChanges() {
  const path = useLocaleChangesPath('wyrmspells.json');
  return useDataFetch<ChangesFile>(path, {});
}

export function useNoblePhantasmChanges() {
  const path = useLocaleChangesPath('noble-phantasm.json');
  return useDataFetch<ChangesFile>(path, {});
}

export function useRelicChanges() {
  const path = useLocaleChangesPath('relic.json');
  return useDataFetch<ChangesFile>(path, {});
}

export function useGoldenAllianceChanges() {
  const path = useLocaleChangesPath('golden-alliances.json');
  return useDataFetch<ChangesFile>(path, {});
}

export function useGearChanges() {
  const path = useLocaleChangesPath('gear.json');
  return useDataFetch<ChangesFile>(path, {});
}

export function useGearSetChanges() {
  const path = useLocaleChangesPath('gear-sets.json');
  return useDataFetch<ChangesFile>(path, {});
}
