import { STORAGE_KEY } from '@/constants/ui';
import {
  readStoredStringSet,
  writeStoredStringSet,
} from '@/utils/saved-storage';
import { useState, type ReactNode } from 'react';
import { FavoriteIllustrationsContext } from './favorite-illustrations';

export function FavoriteIllustrationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [favoriteIllustrations, setFavoriteIllustrations] = useState<
    Set<string>
  >(() => readStoredStringSet(STORAGE_KEY.FAVORITE_ILLUSTRATIONS));

  const toggleFavoriteIllustration = (key: string) => {
    setFavoriteIllustrations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      writeStoredStringSet(STORAGE_KEY.FAVORITE_ILLUSTRATIONS, next);
      return next;
    });
  };

  const isFavoriteIllustration = (key: string): boolean =>
    favoriteIllustrations.has(key);

  return (
    <FavoriteIllustrationsContext.Provider
      value={{
        favoriteIllustrations,
        isFavoriteIllustration,
        toggleFavoriteIllustration,
      }}
    >
      {children}
    </FavoriteIllustrationsContext.Provider>
  );
}
