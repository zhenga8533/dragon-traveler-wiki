import { createContext, createElement, useMemo, type ReactNode } from 'react';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Artifact } from '../types/artifact';
import type { Character } from '../types/character';
import type { Code } from '../types/code';
import type { Gear } from '../types/gear';
import type { Howlkin } from '../types/howlkin';
import type { NoblePhantasm } from '../types/noble-phantasm';
import type { Resource } from '../types/resource';
import type { StatusEffect } from '../types/status-effect';
import type { Subclass } from '../types/subclass';
import type { Team } from '../types/team';
import type { TierList } from '../types/tier-list';
import type { UsefulLink } from '../types/useful-link';
import type { Wyrmspell } from '../types/wyrmspell';

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
  usefulLinks: [],
  tierLists: [],
});

export function SearchDataProvider({ children }: { children: ReactNode }) {
  const { data: characters } = useDataFetch<Character[]>('data/characters.json', []);
  const { data: artifacts } = useDataFetch<Artifact[]>('data/artifacts.json', []);
  const { data: gear } = useDataFetch<Gear[]>('data/gear.json', []);
  const { data: howlkins } = useDataFetch<Howlkin[]>('data/howlkins.json', []);
  const { data: resources } = useDataFetch<Resource[]>('data/resources.json', []);
  const { data: statusEffects } = useDataFetch<StatusEffect[]>('data/status-effects.json', []);
  const { data: subclasses } = useDataFetch<Subclass[]>('data/subclasses.json', []);
  const { data: wyrmspells } = useDataFetch<Wyrmspell[]>('data/wyrmspells.json', []);
  const { data: noblePhantasms } = useDataFetch<NoblePhantasm[]>('data/noble_phantasm.json', []);
  const { data: teams } = useDataFetch<Team[]>('data/teams.json', []);
  const { data: codes } = useDataFetch<Code[]>('data/codes.json', []);
  const { data: usefulLinks } = useDataFetch<UsefulLink[]>('data/useful-links.json', []);
  const { data: tierLists } = useDataFetch<TierList[]>('data/tier-lists.json', []);

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
      usefulLinks,
      tierLists,
    ]
  );

  return createElement(SearchDataContext.Provider, { value }, children);
}
