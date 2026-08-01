import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/utils/data-paths';
import { STORAGE_KEY } from '@/constants/ui';
import { LocaleContext, type LocaleContextValue } from './locale';

function readStoredLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY.LOCALE);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as SupportedLocale;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(readStoredLocale);

  const setLocale = useCallback((next: SupportedLocale) => {
    try {
      localStorage.setItem(STORAGE_KEY.LOCALE, next);
    } catch {
      // ignore
    }
    setLocaleState(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
