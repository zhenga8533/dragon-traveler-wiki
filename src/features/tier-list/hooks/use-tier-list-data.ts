import type { ChangesFile } from '@/types/changes';
import type { TierList } from '@/features/tier-list/types';
import { useLocalePath, useLocaleChangesPath } from '@/hooks/use-locale-path';
import { useDataFetch } from '@/hooks/use-data-fetch';

export function useTierLists() {
  const path = useLocalePath('tier-lists.json');
  return useDataFetch<TierList[]>(path, []);
}

export function useTierListChanges() {
  const path = useLocaleChangesPath('tier-lists.json');
  return useDataFetch<ChangesFile>(path, {});
}
