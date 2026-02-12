import { useMemo, type ReactNode } from 'react';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Resource } from '../types/resource';
import { ResourcesContext } from './resources-context';

export function ResourcesProvider({ children }: { children: ReactNode }) {
  const { data: resources, loading } = useDataFetch<Resource[]>(
    'data/resources.json',
    []
  );

  const value = useMemo(
    () => ({ resources, loading }),
    [resources, loading]
  );

  return (
    <ResourcesContext.Provider value={value}>
      {children}
    </ResourcesContext.Provider>
  );
}
