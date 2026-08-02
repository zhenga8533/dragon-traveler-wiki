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
import { useContext, useMemo } from 'react';
import { LocaleContext } from '@/contexts/locale';
import { dataPath, DEFAULT_LOCALE } from '@/utils/data-paths';
import type { ChangelogEntry } from '@/features/wiki/changelog/types';
import type { ChangesFile } from '@/types/changes';
import type { Code } from '@/features/wiki/codes/types';
import type { Resource } from '@/features/wiki/resources/types';
import type { StarTierData } from '@/features/wiki/star-levels/types';
import type { UsefulLink } from '@/features/wiki/useful-links/types';
import { parseObjectArray, parseObjectRecord } from '@/utils/data-validation';

function useEntityArray<T>(path: string) {
  return useDataFetch<T[]>(path, [], parseObjectArray<T>);
}

function useChangesFile(path: string) {
  return useDataFetch<ChangesFile>(
    path,
    {},
    parseObjectRecord<ChangesFile[string]>,
  );
}

export function useWyrmspells() {
  const path = useLocalePath('wyrmspells.json');
  return useEntityArray<Wyrmspell>(path);
}

export function useStatusEffects() {
  const { locale } = useContext(LocaleContext);
  const localePath = useLocalePath('status-effects.json');
  const enUSPath = dataPath('status-effects.json', DEFAULT_LOCALE);

  const localeResult = useEntityArray<StatusEffect>(localePath);
  // Always fetch enUS so that English bracket references in enUS-fallback characters
  // (those missing from the current locale) can still be matched.
  const enUSResult = useEntityArray<StatusEffect>(enUSPath);

  const data = useMemo(() => {
    if (locale === DEFAULT_LOCALE) return localeResult.data;
    // Locale entries win (translated names match translated bracket text).
    // enUS entries provide English names for characters that fell back to enUS data.
    const localeBySlug = new Map(localeResult.data.map((se) => [se.slug, se]));
    const merged = [...localeResult.data];
    for (const enSE of enUSResult.data) {
      if (!localeBySlug.has(enSE.slug)) {
        merged.push(enSE);
      }
    }
    return merged;
  }, [locale, localeResult.data, enUSResult.data]);

  return {
    data,
    loading:
      localeResult.loading || (locale !== DEFAULT_LOCALE && enUSResult.loading),
    error: locale === DEFAULT_LOCALE ? localeResult.error : enUSResult.error,
    retry: () => {
      localeResult.retry();
      if (locale !== DEFAULT_LOCALE) enUSResult.retry();
    },
  };
}

export function useNoblePhantasms() {
  const path = useLocalePath('noble-phantasm.json');
  return useEntityArray<NoblePhantasm>(path);
}

export function useSubclasses() {
  const path = useLocalePath('subclasses.json');
  return useEntityArray<Subclass>(path);
}

export function useGear() {
  const path = useLocalePath('gear.json');
  return useEntityArray<Gear>(path);
}

export function useGearSets() {
  const path = useLocalePath('gear-sets.json');
  return useEntityArray<GearSet>(path);
}

export function useArtifacts() {
  const path = useLocalePath('artifacts.json');
  return useEntityArray<Artifact>(path);
}

export function useStarLevels() {
  const path = useLocalePath('star-levels.json');
  return useEntityArray<StarTierData>(path);
}

export function useWyrms() {
  const path = useLocalePath('wyrms.json');
  return useEntityArray<Wyrm>(path);
}

export function useHowlkins() {
  const path = useLocalePath('howlkins.json');
  return useEntityArray<Howlkin>(path);
}

export function useGoldenAlliances() {
  const path = useLocalePath('golden-alliances.json');
  return useEntityArray<GoldenAlliance>(path);
}

export function useRelics() {
  const path = useLocalePath('relic.json');
  return useEntityArray<Relic>(path);
}

export function useEvents() {
  const path = useLocalePath('events.json');
  return useEntityArray<GameEvent>(path);
}

export function useCodes() {
  const path = useLocalePath('codes.json');
  return useEntityArray<Code>(path);
}

export function useResources() {
  const path = useLocalePath('resources.json');
  return useEntityArray<Resource>(path);
}

export function useUsefulLinks() {
  const path = useLocalePath('useful-links.json');
  return useEntityArray<UsefulLink>(path);
}

export function useChangelog() {
  const path = useLocalePath('changelog.json');
  return useEntityArray<ChangelogEntry>(path);
}

// Change-history hooks

export function useArtifactChanges() {
  const path = useLocaleChangesPath('artifacts.json');
  return useChangesFile(path);
}

export function useWyrmChanges() {
  const path = useLocaleChangesPath('wyrms.json');
  return useChangesFile(path);
}

export function useWyrmspellChanges() {
  const path = useLocaleChangesPath('wyrmspells.json');
  return useChangesFile(path);
}

export function useNoblePhantasmChanges() {
  const path = useLocaleChangesPath('noble-phantasm.json');
  return useChangesFile(path);
}

export function useRelicChanges() {
  const path = useLocaleChangesPath('relic.json');
  return useChangesFile(path);
}

export function useGoldenAllianceChanges() {
  const path = useLocaleChangesPath('golden-alliances.json');
  return useChangesFile(path);
}

export function useGearChanges() {
  const path = useLocaleChangesPath('gear.json');
  return useChangesFile(path);
}

export function useGearSetChanges() {
  const path = useLocaleChangesPath('gear-sets.json');
  return useChangesFile(path);
}
