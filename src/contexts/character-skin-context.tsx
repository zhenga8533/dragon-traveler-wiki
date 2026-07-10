import { STORAGE_KEY } from '@/constants/ui';
import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CharacterSkinContext } from './character-skin';

function loadSelectedSkins(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const value = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY.CHARACTER_SKINS) ?? '{}'
    );
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    );
  } catch {
    return {};
  }
}

export function CharacterSkinProvider({ children }: { children: ReactNode }) {
  const [selectedSkins, setSelectedSkins] = useState(loadSelectedSkins);

  const getSelectedSkin = useCallback(
    (characterSlug: string) => selectedSkins[characterSlug] ?? 'default',
    [selectedSkins]
  );

  const setSelectedSkin = useCallback(
    (characterSlug: string, skinSlug: string) => {
      setSelectedSkins((current) => {
        const next = { ...current, [characterSlug]: skinSlug };
        window.localStorage.setItem(
          STORAGE_KEY.CHARACTER_SKINS,
          JSON.stringify(next)
        );
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({ selectedSkins, getSelectedSkin, setSelectedSkin }),
    [getSelectedSkin, selectedSkins, setSelectedSkin]
  );

  return (
    <CharacterSkinContext.Provider value={value}>
      {children}
    </CharacterSkinContext.Provider>
  );
}
