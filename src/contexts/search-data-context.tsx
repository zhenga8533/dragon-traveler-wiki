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
});

export function SearchDataProvider({ children }: { children: ReactNode }) {
  const { data: characters } = useCharacters();
  const { data: artifacts } = useArtifacts();
  const { data: gear } = useGear();
  const { data: howlkins } = useHowlkins();
  const { data: relics } = useRelics();
  const { data: resources } = useResources();
  const { data: statusEffects } = useStatusEffects();
  const { data: subclasses } = useSubclasses();
  const { data: wyrmspells } = useWyrmspells();
  const { data: noblePhantasms } = useNoblePhantasms();
  const { data: wyrms } = useWyrms();
  const { data: teams } = useTeams();
  const { data: codes } = useCodes();
  const { data: events } = useEvents();
  const { data: usefulLinks } = useUsefulLinks();
  const { data: tierLists } = useTierLists();

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
    ]
  );

  return createElement(SearchDataContext.Provider, { value }, children);
}
