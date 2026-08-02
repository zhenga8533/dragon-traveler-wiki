import { applyDir } from '@/hooks/use-sort';
import { compareQuality } from '@/utils/quality';
import { WYRM_PHASE_ORDER, type Wyrm, type WyrmPhase } from './types';

export interface WyrmFilters {
  search: string;
  phases: string[];
  qualities: string[];
  factions: string[];
}

export const EMPTY_WYRM_FILTERS: WyrmFilters = {
  search: '',
  phases: [],
  qualities: [],
  factions: [],
};

export function matchesWyrmFilters(wyrm: Wyrm, filters: WyrmFilters) {
  const query = filters.search.trim().toLocaleLowerCase();
  return (
    (!query || wyrm.name.toLocaleLowerCase().includes(query)) &&
    (filters.phases.length === 0 || filters.phases.includes(wyrm.phase)) &&
    (filters.qualities.length === 0 ||
      filters.qualities.includes(wyrm.quality)) &&
    (filters.factions.length === 0 ||
      filters.factions.includes(wyrm.faction))
  );
}

function phaseRank(phase: WyrmPhase) {
  const rank = WYRM_PHASE_ORDER.indexOf(phase);
  return rank === -1 ? WYRM_PHASE_ORDER.length : rank;
}

export function compareWyrms(
  left: Wyrm,
  right: Wyrm,
  column: string | null,
  direction: 'asc' | 'desc'
) {
  let comparison = 0;
  if (column === 'name') comparison = left.name.localeCompare(right.name);
  else if (column === 'phase') {
    comparison = phaseRank(left.phase) - phaseRank(right.phase);
  } else if (column === 'quality') {
    comparison = compareQuality(left.quality, right.quality);
  } else if (column === 'faction') {
    comparison = left.faction.localeCompare(right.faction);
  }
  if (comparison) return applyDir(comparison, direction);

  return (
    left.faction.localeCompare(right.faction) ||
    phaseRank(left.phase) - phaseRank(right.phase) ||
    left.name.localeCompare(right.name)
  );
}
