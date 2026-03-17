import { STORAGE_KEY } from '@/constants/ui';
import {
  createContext,
  useState,
  type ReactNode,
} from 'react';

export interface CharacterOwnershipContextValue {
  /** Map of character identity key → owned star level value. Absent key = not owned. */
  ownedCharacters: Record<string, string>;
  /** Set (or clear with null) the owned star level for a character identity key. */
  setCharacterStarLevel: (identityKey: string, value: string | null) => void;
  /** Get the owned star level value for a character identity key, or null if not owned. */
  getCharacterStarLevel: (identityKey: string) => string | null;
  /** Returns true if the character identity key has any star level set. */
  isOwned: (identityKey: string) => boolean;
  /** When true, character cards gray out characters that are not owned. */
  grayUnowned: boolean;
  setGrayUnowned: (value: boolean) => void;
  /**
   * When true, tier badges are shown on character cards/pages, the tier list
   * reference picker is visible in Settings, and the featured characters
   * marquee is shown on the home page.
   */
  showCharacterTiers: boolean;
  setShowCharacterTiers: (value: boolean) => void;
}

export const CharacterOwnershipContext =
  createContext<CharacterOwnershipContextValue>({
    ownedCharacters: {},
    setCharacterStarLevel: () => {},
    getCharacterStarLevel: () => null,
    isOwned: () => false,
    grayUnowned: false,
    setGrayUnowned: () => {},
    showCharacterTiers: true,
    setShowCharacterTiers: () => {},
  });

function loadOwnedFromStorage(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY.CHARACTER_OWNERSHIP);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    )
      return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function loadGrayUnownedFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY.UI_GRAY_UNOWNED) === 'true';
}

function loadBoolPref(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return defaultValue;
  return raw === 'true';
}

export function CharacterOwnershipProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ownedCharacters, setOwnedCharacters] = useState<Record<string, string>>(
    () => loadOwnedFromStorage()
  );
  const [grayUnowned, setGrayUnownedState] = useState<boolean>(
    () => loadGrayUnownedFromStorage()
  );
  const [showCharacterTiers, setShowCharacterTiersState] = useState<boolean>(
    () => loadBoolPref(STORAGE_KEY.UI_SHOW_CHARACTER_TIERS, true)
  );

  const setCharacterStarLevel = (
    identityKey: string,
    value: string | null
  ) => {
    setOwnedCharacters((prev) => {
      const next = { ...prev };
      if (value === null) {
        delete next[identityKey];
      } else {
        next[identityKey] = value;
      }
      window.localStorage.setItem(
        STORAGE_KEY.CHARACTER_OWNERSHIP,
        JSON.stringify(next)
      );
      return next;
    });
  };

  const getCharacterStarLevel = (identityKey: string): string | null =>
    ownedCharacters[identityKey] ?? null;

  const isOwned = (identityKey: string): boolean =>
    identityKey in ownedCharacters;

  const setGrayUnowned = (value: boolean) => {
    setGrayUnownedState(value);
    window.localStorage.setItem(STORAGE_KEY.UI_GRAY_UNOWNED, String(value));
  };

  const setShowCharacterTiers = (value: boolean) => {
    setShowCharacterTiersState(value);
    window.localStorage.setItem(STORAGE_KEY.UI_SHOW_CHARACTER_TIERS, String(value));
  };

  return (
    <CharacterOwnershipContext.Provider
      value={{
        ownedCharacters,
        setCharacterStarLevel,
        getCharacterStarLevel,
        isOwned,
        grayUnowned,
        setGrayUnowned,
        showCharacterTiers,
        setShowCharacterTiers,
      }}
    >
      {children}
    </CharacterOwnershipContext.Provider>
  );
}
