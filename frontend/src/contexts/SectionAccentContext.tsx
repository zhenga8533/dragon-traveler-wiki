import { useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getAccentForPath } from '../constants/accents';
import { SectionAccentContext } from './section-accent-context';

export function SectionAccentProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const value = useMemo(
    () => ({
      accent: getAccentForPath(location.pathname),
      path: location.pathname,
    }),
    [location.pathname]
  );

  return (
    <SectionAccentContext.Provider value={value}>
      {children}
    </SectionAccentContext.Provider>
  );
}
