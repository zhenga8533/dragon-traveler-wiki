import { STORAGE_KEY } from '@/constants/ui';
import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CharacterSkinContext } from './character-skin';

function loadSkinsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY.CHARACTER_SKINS_ENABLED) === 'true';
}

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
  const [skinsEnabled, setSkinsEnabledState] = useState(loadSkinsEnabled);

  const setSkinsEnabled = useCallback((enabled: boolean) => {
    setSkinsEnabledState(enabled);
    window.localStorage.setItem(
      STORAGE_KEY.CHARACTER_SKINS_ENABLED,
      String(enabled)
    );
  }, []);

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
    () => ({
      selectedSkins,
      getSelectedSkin,
      setSelectedSkin,
      skinsEnabled,
      setSkinsEnabled,
    }),
    [
      getSelectedSkin,
      selectedSkins,
      setSelectedSkin,
      skinsEnabled,
      setSkinsEnabled,
    ]
  );

  return (
    <CharacterSkinContext.Provider value={value}>
      {children}
    </CharacterSkinContext.Provider>
  );
}
