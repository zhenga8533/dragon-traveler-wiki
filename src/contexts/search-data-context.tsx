/* eslint-disable react-refresh/only-export-components */
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import type { Character } from '@/features/characters/types';
import { useTeams } from '@/features/teams/hooks/use-teams-data';
import type { Team } from '@/features/teams/types';
import { useTierLists } from '@/features/tier-list/hooks/use-tier-list-data';
import type { TierList } from '@/features/tier-list/types';
import {
  useArtifacts,
  useCodes,
  useEvents,
  useGear,
  useHowlkins,
  useNoblePhantasms,
  useRelics,
  useResources,
  useStatusEffects,
  useSubclasses,
  useUsefulLinks,
  useWyrms,
  useWyrmspells,
} from '@/features/wiki/hooks/use-wiki-data';
import type { Artifact } from '@/features/wiki/artifacts/types';
import type { GameEvent } from '@/features/wiki/events/types';
import type { Gear } from '@/features/wiki/gear/types';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { Relic } from '@/features/wiki/relics/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { Wyrm } from '@/features/wiki/wyrms/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import type { Code } from '@/types/code';
import type { Resource } from '@/types/resource';
import type { UsefulLink } from '@/types/useful-link';
import { createContext, createElement, useMemo, type ReactNode } from 'react';

export interface SearchDataContextValue {
  characters: Character[];
  artifacts: Artifact[];
  gear: Gear[];
  howlkins: Howlkin[];
  relics: Relic[];
  resources: Resource[];
  statusEffects: StatusEffect[];
  subclasses: Subclass[];
  wyrms: Wyrm[];
  wyrmspells: Wyrmspell[];
  noblePhantasms: NoblePhantasm[];
  teams: Team[];
  codes: Code[];
  events: GameEvent[];
  usefulLinks: UsefulLink[];
  tierLists: TierList[];
  loading: boolean;
  errors: Error[];
}

export const SearchDataContext = createContext<SearchDataContextValue>({
  characters: [],
  artifacts: [],
  gear: [],
  howlkins: [],
  relics: [],
  resources: [],
  statusEffects: [],
  subclasses: [],
  wyrms: [],
  wyrmspells: [],
  noblePhantasms: [],
  teams: [],
  codes: [],
  events: [],
  usefulLinks: [],
  tierLists: [],
  loading: false,
  errors: [],
});

export function SearchDataProvider({ children }: { children: ReactNode }) {
  const characterResult = useCharacters();
  const artifactResult = useArtifacts();
  const gearResult = useGear();
  const howlkinResult = useHowlkins();
  const relicResult = useRelics();
  const resourceResult = useResources();
  const statusEffectResult = useStatusEffects();
  const subclassResult = useSubclasses();
  const wyrmspellResult = useWyrmspells();
  const noblePhantasmResult = useNoblePhantasms();
  const wyrmResult = useWyrms();
  const teamResult = useTeams();
  const codeResult = useCodes();
  const eventResult = useEvents();
  const usefulLinkResult = useUsefulLinks();
  const tierListResult = useTierLists();

  const results = [
    characterResult,
    artifactResult,
    gearResult,
    howlkinResult,
    relicResult,
    resourceResult,
    statusEffectResult,
    subclassResult,
    wyrmspellResult,
    noblePhantasmResult,
    wyrmResult,
    teamResult,
    codeResult,
    eventResult,
    usefulLinkResult,
    tierListResult,
  ];
  const loading = results.some((result) => result.loading);
  const errors = results.flatMap((result) => (result.error ? [result.error] : []));

  const characters = characterResult.data;
  const artifacts = artifactResult.data;
  const gear = gearResult.data;
  const howlkins = howlkinResult.data;
  const relics = relicResult.data;
  const resources = resourceResult.data;
  const statusEffects = statusEffectResult.data;
  const subclasses = subclassResult.data;
  const wyrmspells = wyrmspellResult.data;
  const noblePhantasms = noblePhantasmResult.data;
  const wyrms = wyrmResult.data;
  const teams = teamResult.data;
  const codes = codeResult.data;
  const events = eventResult.data;
  const usefulLinks = usefulLinkResult.data;
  const tierLists = tierListResult.data;

  const value = useMemo(
    () => ({
      characters,
      artifacts,
      gear,
      howlkins,
      relics,
      resources,
      statusEffects,
      subclasses,
      wyrms,
      wyrmspells,
      noblePhantasms,
      teams,
      codes,
      events,
      usefulLinks,
      tierLists,
      loading,
      errors,
    }),
    [
      characters,
      artifacts,
      gear,
      howlkins,
      relics,
      resources,
      statusEffects,
      subclasses,
      wyrms,
      wyrmspells,
      noblePhantasms,
      teams,
      codes,
      events,
      usefulLinks,
      tierLists,
      loading,
      errors,
    ]
  );

  return createElement(SearchDataContext.Provider, { value }, children);
}
