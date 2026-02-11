import { createContext } from 'react';
import type { TierList as TierListType } from '../types/tier-list';

export interface TierListReferenceContextValue {
  tierLists: TierListType[];
  loading: boolean;
  selectedTierListName: string;
  setSelectedTierListName: (name: string) => void;
}

export const TierListReferenceContext =
  createContext<TierListReferenceContextValue>({
    tierLists: [],
    loading: false,
    selectedTierListName: '',
    setSelectedTierListName: () => {},
  });
