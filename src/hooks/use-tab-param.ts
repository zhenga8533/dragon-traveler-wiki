import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  resolveEntityTabName,
  resolveTabParam,
  setDefaultOmittingSearchParam,
  setEntitySearchParam,
} from '@/utils/search-param-tabs';

/**
 * Syncs a tab selection with a URL search parameter.
 * The default tab value is omitted from the URL for a clean URL.
 *
 * @param paramName  The search param key (e.g. 'tab')
 * @param defaultTab The default tab value (omitted from URL when active)
 * @param validTabs  List of valid tab values; invalid URL values fall back to default
 */
export function useTabParam(
  paramName: string,
  defaultTab: string,
  validTabs: string[],
): [string, (tab: string | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(paramName);
  const tab = resolveTabParam(raw, defaultTab, validTabs);

  function setTab(value: string | null) {
    setSearchParams((previous) =>
      setDefaultOmittingSearchParam(previous, paramName, value, defaultTab),
    );
  }

  return [tab, setTab];
}

/**
 * Syncs an entity selection (by name) with a URL search parameter using slugs.
 * Matches the URL slug against items via toEntitySlug, falling back to the first item.
 *
 * @param paramName The search param key (e.g. 'list')
 * @param items     The list of entities with a `name` field to match against
 */
export function useEntityTabParam(
  paramName: string,
  items: readonly { name: string }[],
): [string | undefined, (name: string | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get(paramName);

  const activeValue = useMemo(() => {
    return resolveEntityTabName(param, items);
  }, [param, items]);

  function setItem(name: string | null) {
    setSearchParams((previous) =>
      setEntitySearchParam(previous, paramName, name),
    );
  }

  return [activeValue, setItem];
}
