import { STORAGE_KEY } from '@/constants/ui';
import type { TierList } from '@/features/tier-list/types';
import { migrateStoredTierList } from '@/features/tier-list/utils/tier-list-builder';
import {
  deleteSavedFromStorage,
  hasSavedInStorage,
  loadSavedFromStorage,
  upsertSavedInStorage,
} from '@/utils/saved-storage';

const isSavedTierList = (value: Partial<TierList>) =>
  Array.isArray(value.entries);

export function loadSavedTierLists(): TierList[] {
  return loadSavedFromStorage(
    STORAGE_KEY.TIER_LIST_MY_SAVED,
    isSavedTierList,
    migrateStoredTierList
  );
}

export function hasSavedTierList(slug: string): boolean {
  return hasSavedInStorage(STORAGE_KEY.TIER_LIST_MY_SAVED, slug);
}

export function saveTierList(slug: string, tierList: TierList): void {
  upsertSavedInStorage(STORAGE_KEY.TIER_LIST_MY_SAVED, slug, tierList);
}

export function removeSavedTierList(slug: string): void {
  deleteSavedFromStorage(STORAGE_KEY.TIER_LIST_MY_SAVED, slug);
}
