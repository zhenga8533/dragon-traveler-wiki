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
import {
  getTierListEntityType,
  type TierList as TierListType,
} from '@/features/tier-list/types';
import { loadSavedTierLists } from '@/features/tier-list/saved-tier-lists';

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
  return loadSavedTierLists();
}

export function TierListReferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: allTierLists, loading } = useTierLists();
  const tierLists = useMemo(
    () =>
      allTierLists.filter(
        (tierList) => getTierListEntityType(tierList) === 'character'
      ),
    [allTierLists]
  );
  const [savedTierLists, setSavedTierLists] = useState<TierListType[]>(() =>
    readSavedTierLists().filter(
      (tierList) => getTierListEntityType(tierList) === 'character'
    )
  );
  const [selectedTierListName, setSelectedTierListName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return (
      window.localStorage.getItem(STORAGE_KEY.CHARACTER_TIER_LIST_REFERENCE) ||
      ''
    );
  });

  const refreshSaved = useCallback(() => {
    setSavedTierLists(
      readSavedTierLists().filter(
        (tierList) => getTierListEntityType(tierList) === 'character'
      )
    );
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
