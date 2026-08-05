import type { ChangesFile } from '@/types/changes';
import type { TierList } from '@/features/tier-list/types';
import { useLocalePath, useLocaleChangesPath } from '@/hooks/use-locale-path';
import { useDataFetch } from '@/hooks/use-data-fetch';
import { parseObjectArray, parseObjectRecord } from '@/utils/data-validation';

export function useTierLists() {
  const path = useLocalePath('tier-lists.json');
  return useDataFetch<TierList[]>(path, [], parseObjectArray<TierList>);
}

export function useTierListChanges() {
  const path = useLocaleChangesPath('tier-lists.json');
  return useDataFetch<ChangesFile>(
    path,
    {},
    parseObjectRecord<ChangesFile[string]>,
  );
}
