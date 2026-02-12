import { createContext, createElement, useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { SectionAccent } from '../constants/accents';
import { getAccentForPath } from '../constants/accents';

export interface SectionAccentContextValue {
  /** Current section's accent color */
  accent: SectionAccent;
  /** Current path */
  path: string;
}

export const SectionAccentContext = createContext<SectionAccentContextValue>({
  accent: 'violet',
  path: '/',
});

export function SectionAccentProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const value = useMemo(
    () => ({
      accent: getAccentForPath(location.pathname),
      path: location.pathname,
    }),
    [location.pathname]
  );

  return createElement(SectionAccentContext.Provider, { value }, children);
}
