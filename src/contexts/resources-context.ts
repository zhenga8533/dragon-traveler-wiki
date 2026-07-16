import { createContext, createElement, useMemo, type ReactNode } from 'react';
import { useResources } from '@/features/wiki/hooks/use-wiki-data';
import type { Resource } from '@/types/resource';

export interface ResourcesContextValue {
  resources: Resource[];
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export const ResourcesContext = createContext<ResourcesContextValue>({
  resources: [],
  loading: false,
  error: null,
  retry: () => undefined,
});

export function ResourcesProvider({ children }: { children: ReactNode }) {
  const { data: resources, loading, error, retry } = useResources();

  const value = useMemo(
    () => ({ resources, loading, error, retry }),
    [resources, loading, error, retry]
  );

  return createElement(ResourcesContext.Provider, { value }, children);
}
