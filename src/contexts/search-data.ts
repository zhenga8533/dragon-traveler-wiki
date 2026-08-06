import { createContext } from 'react';
import type { Character } from '@/features/characters/types';
import type { Team } from '@/features/teams/types';
import type { TierList } from '@/features/tier-list/types';
import type { Artifact } from '@/features/wiki/artifacts/types';
import type { Code } from '@/features/wiki/codes/types';
import type { GameEvent } from '@/features/wiki/events/types';
import type { Gear } from '@/features/wiki/gear/types';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { Relic } from '@/features/wiki/relics/types';
import type { Resource } from '@/features/wiki/resources/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { UsefulLink } from '@/features/wiki/useful-links/types';
import type { Wyrm } from '@/features/wiki/wyrms/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';

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
