import { createContext } from 'react';
import type { Resource } from '../types/resource';

export interface ResourcesContextValue {
  resources: Resource[];
  loading: boolean;
}

export const ResourcesContext = createContext<ResourcesContextValue>({
  resources: [],
  loading: false,
});
