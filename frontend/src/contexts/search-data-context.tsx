/* eslint-disable react-refresh/only-export-components */
import type { Character } from '@/features/characters/types';
import type { TierList } from '@/features/tier-list/types';
import type { Team } from '@/features/teams/types';
import type { Artifact } from '@/features/wiki/artifacts/types';
import type { GameEvent } from '@/features/wiki/events/types';
import type { Gear } from '@/features/wiki/gear/types';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { useDataFetch } from '@/hooks/use-data-fetch';
import type { Code } from '@/types/code';
import type { Resource } from '@/types/resource';
import type { UsefulLink } from '@/types/useful-link';
import { createContext, createElement, useMemo, type ReactNode } from 'react';

export interface SearchDataContextValue {
  characters: Character[];
  artifacts: Artifact[];
  gear: Gear[];
  howlkins: Howlkin[];
  resources: Resource[];
  statusEffects: StatusEffect[];
  subclasses: Subclass[];
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
  resources: [],
  statusEffects: [],
  subclasses: [],
  wyrmspells: [],
  noblePhantasms: [],
  teams: [],
  codes: [],
  events: [],
  usefulLinks: [],
  tierLists: [],
});

export function SearchDataProvider({ children }: { children: ReactNode }) {
  const { data: characters } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: artifacts } = useDataFetch<Artifact[]>(
    'data/artifacts.json',
    []
  );
  const { data: gear } = useDataFetch<Gear[]>('data/gear.json', []);
  const { data: howlkins } = useDataFetch<Howlkin[]>('data/howlkins.json', []);
  const { data: resources } = useDataFetch<Resource[]>(
    'data/resources.json',
    []
  );
  const { data: statusEffects } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );
  const { data: subclasses } = useDataFetch<Subclass[]>(
    'data/subclasses.json',
    []
  );
  const { data: wyrmspells } = useDataFetch<Wyrmspell[]>(
    'data/wyrmspells.json',
    []
  );
  const { data: noblePhantasms } = useDataFetch<NoblePhantasm[]>(
    'data/noble_phantasm.json',
    []
  );
  const { data: teams } = useDataFetch<Team[]>('data/teams.json', []);
  const { data: codes } = useDataFetch<Code[]>('data/codes.json', []);
  const { data: events } = useDataFetch<GameEvent[]>('data/events.json', []);
  const { data: usefulLinks } = useDataFetch<UsefulLink[]>(
    'data/useful-links.json',
    []
  );
  const { data: tierLists } = useDataFetch<TierList[]>(
    'data/tier-lists.json',
    []
  );

  const value = useMemo(
    () => ({
      characters,
      artifacts,
      gear,
      howlkins,
      resources,
      statusEffects,
      subclasses,
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
      resources,
      statusEffects,
      subclasses,
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
