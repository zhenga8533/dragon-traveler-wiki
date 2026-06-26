import { createContext } from 'react';
import { DEFAULT_LOCALE, type SupportedLocale } from '@/utils/data-paths';

export interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});
