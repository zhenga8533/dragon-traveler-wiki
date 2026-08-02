import { STATE_ORDER } from '@/constants/status-effect-colors';
import { applyDir } from '@/hooks/use-sort';
import type { StatusEffect, StatusEffectType } from './types';

export interface StatusEffectFilters {
  search: string;
  types: StatusEffectType[];
}

export const EMPTY_STATUS_EFFECT_FILTERS: StatusEffectFilters = {
  search: '',
  types: [],
};

export function matchesStatusEffectFilters(
  effect: StatusEffect,
  filters: StatusEffectFilters,
) {
  const query = filters.search.trim().toLocaleLowerCase();
  return (
    (!query || effect.name.toLocaleLowerCase().includes(query)) &&
    (filters.types.length === 0 || filters.types.includes(effect.type))
  );
}

function statusEffectTypeRank(type: StatusEffectType) {
  const rank = STATE_ORDER.indexOf(type);
  return rank === -1 ? STATE_ORDER.length : rank;
}

export function compareStatusEffects(
  left: StatusEffect,
  right: StatusEffect,
  column: string | null,
  direction: 'asc' | 'desc',
) {
  let comparison = 0;
  if (column === 'name') comparison = left.name.localeCompare(right.name);
  else if (column === 'type') {
    comparison =
      statusEffectTypeRank(left.type) - statusEffectTypeRank(right.type);
  }
  if (comparison) return applyDir(comparison, direction);

  return (
    statusEffectTypeRank(left.type) - statusEffectTypeRank(right.type) ||
    left.name.localeCompare(right.name)
  );
}
