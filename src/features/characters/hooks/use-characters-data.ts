import { useContext, useMemo } from 'react';
import type { Character } from '@/features/characters/types';
import type { ChangesFile } from '@/types/changes';
import { LocaleContext } from '@/contexts/locale-context';
import { useLocalePath, useLocaleChangesPath } from '@/hooks/use-locale-path';
import { useDataFetch } from '@/hooks/use-data-fetch';
import { changesPath, dataPath, DEFAULT_LOCALE } from '@/lib/data-paths';

export function useCharacters() {
  const { locale } = useContext(LocaleContext);
  const localePath = useLocalePath('characters.json');
  const enUSPath = dataPath('characters.json', DEFAULT_LOCALE);

  const localeResult = useDataFetch<Character[]>(localePath, []);
  // Always fetch enUS so missing locale characters can fall back to it.
  // When locale is already enUS, both paths are identical and the cache deduplicates the request.
  const enUSResult = useDataFetch<Character[]>(enUSPath, []);

  const data = useMemo(() => {
    if (locale === DEFAULT_LOCALE) return localeResult.data;

    const localeBySlug = new Map(localeResult.data.map((c) => [c.slug, c]));
    const merged = [...localeResult.data];
    for (const enChar of enUSResult.data) {
      if (!localeBySlug.has(enChar.slug)) {
        merged.push(enChar);
      }
    }
    return merged;
  }, [locale, localeResult.data, enUSResult.data]);

  return {
    data,
    // For non-enUS locales, wait for both fetches before reporting done.
    loading: localeResult.loading || (locale !== DEFAULT_LOCALE && enUSResult.loading),
    // Only surface the enUS error — a locale fetch failure just means graceful fallback.
    error: locale === DEFAULT_LOCALE ? localeResult.error : enUSResult.error,
  };
}

export function useCharacterChanges() {
  const { locale } = useContext(LocaleContext);
  const localePath = useLocaleChangesPath('characters.json');
  const enUSPath = changesPath('characters.json', DEFAULT_LOCALE);

  const localeResult = useDataFetch<ChangesFile>(localePath, {});
  const enUSResult = useDataFetch<ChangesFile>(enUSPath, {});

  const data = useMemo(() => {
    if (locale === DEFAULT_LOCALE) return localeResult.data;
    // Merge: locale entries win; enUS fills in slugs absent from the locale changes file.
    return { ...enUSResult.data, ...localeResult.data };
  }, [locale, localeResult.data, enUSResult.data]);

  return {
    data,
    loading: localeResult.loading || (locale !== DEFAULT_LOCALE && enUSResult.loading),
    error: locale === DEFAULT_LOCALE ? localeResult.error : enUSResult.error,
  };
}
