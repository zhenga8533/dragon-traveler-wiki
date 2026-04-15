import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';

interface UseBuilderEditStateOptions<T> {
  /** localStorage key to check for an existing builder draft */
  draftStorageKey: string;
  setSearchParams: SetURLSearchParams;
  /** Item passed via router location state (navigating from another page into the builder) */
  navigationInitialItem?: T | null;
  /** navigate function — required if navigationInitialItem may be provided */
  navigate?: NavigateFunction;
}

interface UseBuilderEditStateReturn<T> {
  editData: T | null;
  setEditData: Dispatch<SetStateAction<T | null>>;
  pendingEditItem: T | null;
  setPendingEditItem: Dispatch<SetStateAction<T | null>>;
  confirmEditOpen: boolean;
  setConfirmEditOpen: Dispatch<SetStateAction<boolean>>;
  pendingDeleteSavedItem: string | null;
  setPendingDeleteSavedItem: Dispatch<SetStateAction<string | null>>;
  openInBuilder: (item: T) => void;
  requestEdit: (item: T) => void;
}

/**
 * Manages shared edit/delete state for pages that have a view + builder pattern
 * (e.g. Teams and Tier List pages).
 */
export function useBuilderEditState<T>({
  draftStorageKey,
  setSearchParams,
  navigationInitialItem,
  navigate,
}: UseBuilderEditStateOptions<T>): UseBuilderEditStateReturn<T> {
  const [editData, setEditData] = useState<T | null>(
    () => navigationInitialItem ?? null
  );
  const [pendingEditItem, setPendingEditItem] = useState<T | null>(null);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [pendingDeleteSavedItem, setPendingDeleteSavedItem] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (navigationInitialItem && navigate) {
      navigate('?mode=builder', { replace: true, state: {} });
    }
  }, [navigationInitialItem, navigate]);

  function hasBuilderDraft() {
    if (typeof window === 'undefined') return true;
    return Boolean(window.localStorage.getItem(draftStorageKey));
  }

  function openInBuilder(item: T) {
    setEditData(item);
    setSearchParams({ mode: 'builder' });
  }

  function requestEdit(item: T) {
    if (!hasBuilderDraft()) {
      openInBuilder(item);
      return;
    }
    setPendingEditItem(item);
    setConfirmEditOpen(true);
  }

  return {
    editData,
    setEditData,
    pendingEditItem,
    setPendingEditItem,
    confirmEditOpen,
    setConfirmEditOpen,
    pendingDeleteSavedItem,
    setPendingDeleteSavedItem,
    openInBuilder,
    requestEdit,
  };
}
