import type { Faction } from '@/types/faction';
import { useDataFetch } from './use-data-fetch';

export function useFactions() {
  return useDataFetch<Faction[]>('data/factions.json', []);
}
