import type { ChangesFile } from '@/types/changes';
import type { TierList } from '@/features/tier-list/types';
import { useDataFetch } from '@/hooks/use-data-fetch';

export function useTierLists() {
  return useDataFetch<TierList[]>('data/tier-lists.json', []);
}

export function useTierListChanges() {
  return useDataFetch<ChangesFile>('data/changes/tier-lists.json', {});
}
