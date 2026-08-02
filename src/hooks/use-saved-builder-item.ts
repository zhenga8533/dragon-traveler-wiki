import {
  getSavedBuilderItemKey,
  type SavedBuilderItem,
  withSavedTimestamp,
} from '@/features/builders/saved-builder-item';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useState } from 'react';

interface UseSavedBuilderItemOptions<T extends SavedBuilderItem> {
  item: T;
  entityLabel: string;
  collectionLabel: string;
  hasSavedItem: (key: string) => boolean;
  saveItem: (key: string, item: T) => void;
  onSaved?: () => void;
}

export function useSavedBuilderItem<T extends SavedBuilderItem>({
  item,
  entityLabel,
  collectionLabel,
  hasSavedItem,
  saveItem,
  onSaved,
}: UseSavedBuilderItemOptions<T>) {
  const [pendingOverwriteKey, setPendingOverwriteKey] = useState<string | null>(
    null,
  );

  function save(key: string) {
    try {
      saveItem(key, withSavedTimestamp(item));
      onSaved?.();
      showSuccessToast({
        title: 'Saved!',
        message: `"${key}" saved to ${collectionLabel}.`,
      });
    } catch {
      showErrorToast({
        title: `Could not save ${entityLabel}`,
        message: 'Browser storage could not be updated. Please try again.',
      });
    }
  }

  function requestSave() {
    const key = getSavedBuilderItemKey(item.name);
    if (hasSavedItem(key)) {
      setPendingOverwriteKey(key);
      return;
    }
    save(key);
  }

  function confirmOverwrite() {
    if (pendingOverwriteKey) save(pendingOverwriteKey);
    setPendingOverwriteKey(null);
  }

  return {
    pendingOverwriteKey,
    requestSave,
    confirmOverwrite,
    cancelOverwrite: () => setPendingOverwriteKey(null),
  };
}
