import { useContext } from 'react';
import { LocaleContext } from '@/contexts/locale';
import { changesPath, dataPath } from '@/utils/data-paths';

/** Returns the locale-aware fetch path for a data file. */
export function useLocalePath(filename: string): string {
  const { locale } = useContext(LocaleContext);
  return dataPath(filename, locale);
}

/** Returns the locale-aware fetch path for a change-history file. */
export function useLocaleChangesPath(filename: string): string {
  const { locale } = useContext(LocaleContext);
  return changesPath(filename, locale);
}
