import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEY } from '@/constants/ui';
import { useTierLists } from '@/features/tier-list/hooks/use-tier-list-data';
import type { TierList as TierListType } from '@/features/tier-list/types';
import { migrateStoredTierList } from '@/features/tier-list/utils/tier-list-builder';
import { loadSavedFromStorage } from '@/utils/saved-storage';

export interface TierListReferenceContextValue {
  tierLists: TierListType[];
  savedTierLists: TierListType[];
  loading: boolean;
  selectedTierListName: string;
  setSelectedTierListName: (name: string) => void;
}

export const TierListReferenceContext =
  createContext<TierListReferenceContextValue>({
    tierLists: [],
    savedTierLists: [],
    loading: false,
    selectedTierListName: '',
    setSelectedTierListName: () => {},
  });

function readSavedTierLists(): TierListType[] {
  return loadSavedFromStorage<TierListType>(
    STORAGE_KEY.TIER_LIST_MY_SAVED,
    (v) => Array.isArray(v.entries),
    migrateStoredTierList
  );
}

export function TierListReferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: tierLists, loading } = useTierLists();
  const [savedTierLists, setSavedTierLists] = useState<TierListType[]>(() =>
    readSavedTierLists()
  );
  const [selectedTierListName, setSelectedTierListName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return (
      window.localStorage.getItem(STORAGE_KEY.CHARACTER_TIER_LIST_REFERENCE) ||
      ''
    );
  });

  const refreshSaved = useCallback(() => {
    setSavedTierLists(readSavedTierLists());
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY.TIER_LIST_MY_SAVED) refreshSaved();
    };
    window.addEventListener('tier-list:saved-changed', refreshSaved);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('tier-list:saved-changed', refreshSaved);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshSaved]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedTierListName) {
      window.localStorage.setItem(
        STORAGE_KEY.CHARACTER_TIER_LIST_REFERENCE,
        selectedTierListName
      );
    } else {
      window.localStorage.removeItem(STORAGE_KEY.CHARACTER_TIER_LIST_REFERENCE);
    }
  }, [selectedTierListName]);

  useEffect(() => {
    if (loading || tierLists.length === 0) return;
    if (!selectedTierListName) {
      queueMicrotask(() => {
        setSelectedTierListName(tierLists[0].name);
      });
      return;
    }
    const existsInOfficial = tierLists.some(
      (list) => list.name === selectedTierListName
    );
    const existsInSaved = savedTierLists.some(
      (list) => list.name === selectedTierListName
    );
    if (!existsInOfficial && !existsInSaved) {
      queueMicrotask(() => {
        setSelectedTierListName(tierLists[0].name);
      });
    }
  }, [selectedTierListName, tierLists, savedTierLists, loading]);

  const value = useMemo(
    () => ({
      tierLists,
      savedTierLists,
      loading,
      selectedTierListName,
      setSelectedTierListName,
    }),
    [tierLists, savedTierLists, loading, selectedTierListName]
  );

  return createElement(TierListReferenceContext.Provider, { value }, children);
}
