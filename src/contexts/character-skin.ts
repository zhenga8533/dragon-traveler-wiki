import { createContext } from 'react';

export interface CharacterSkinContextValue {
  selectedSkins: Record<string, string>;
  getSelectedSkin: (characterSlug: string) => string;
  setSelectedSkin: (characterSlug: string, skinSlug: string) => void;
  skinsEnabled: boolean;
  setSkinsEnabled: (enabled: boolean) => void;
  /** Like `getSelectedSkin`, but resolves to 'default' unless `skinsEnabled` (or `force`) is set. */
  getDisplaySkin: (
    characterSlug: string,
    options?: { force?: boolean },
  ) => string;
}

export const CharacterSkinContext = createContext<CharacterSkinContextValue>({
  selectedSkins: {},
  getSelectedSkin: () => 'default',
  setSelectedSkin: () => {},
  skinsEnabled: false,
  setSkinsEnabled: () => {},
  getDisplaySkin: () => 'default',
});
