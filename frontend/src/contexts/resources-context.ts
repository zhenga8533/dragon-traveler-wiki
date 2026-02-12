import { createContext, createElement, useMemo, type ReactNode } from 'react';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Resource } from '../types/resource';

export interface ResourcesContextValue {
  resources: Resource[];
  loading: boolean;
}

export const ResourcesContext = createContext<ResourcesContextValue>({
  resources: [],
  loading: false,
});

export function ResourcesProvider({ children }: { children: ReactNode }) {
  const { data: resources, loading } = useDataFetch<Resource[]>(
    'data/resources.json',
    []
  );

  const value = useMemo(() => ({ resources, loading }), [resources, loading]);

  return createElement(ResourcesContext.Provider, { value }, children);
}
