import type { Faction } from '@/types/faction';
import { useLocalePath } from '@/hooks/use-locale-path';
import { useDataFetch } from './use-data-fetch';
import { parseObjectArray } from '@/utils/data-validation';

export function useFactions() {
  const path = useLocalePath('factions.json');
  return useDataFetch<Faction[]>(path, [], parseObjectArray<Faction>);
}
