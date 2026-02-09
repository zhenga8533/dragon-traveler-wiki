import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { TierList as TierListType } from '../types/tier-list';
import { TierListReferenceContext } from './tier-list-reference-context';

export function TierListReferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: tierLists, loading } = useDataFetch<TierListType[]>(
    'data/tier-lists.json',
    []
  );
  const [selectedTierListName, setSelectedTierListName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return (
      window.localStorage.getItem(STORAGE_KEY.CHARACTER_TIER_LIST_REFERENCE) ||
      ''
    );
  });

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
    if (loading || !selectedTierListName) return;
    const exists = tierLists.some((list) => list.name === selectedTierListName);
    if (!exists) {
      setSelectedTierListName('');
    }
  }, [selectedTierListName, tierLists, loading]);

  const value = useMemo(
    () => ({
      tierLists,
      loading,
      selectedTierListName,
      setSelectedTierListName,
    }),
    [tierLists, loading, selectedTierListName]
  );

  return (
    <TierListReferenceContext.Provider value={value}>
      {children}
    </TierListReferenceContext.Provider>
  );
}
