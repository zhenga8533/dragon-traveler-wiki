import { createContext } from 'react';

export interface FavoriteIllustrationsContextValue {
  favoriteIllustrations: Set<string>;
  isFavoriteIllustration: (key: string) => boolean;
  toggleFavoriteIllustration: (key: string) => void;
}

export const FavoriteIllustrationsContext =
  createContext<FavoriteIllustrationsContextValue>({
    favoriteIllustrations: new Set(),
    isFavoriteIllustration: () => false,
    toggleFavoriteIllustration: () => {},
  });
