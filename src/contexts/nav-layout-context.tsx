import { STORAGE_KEY } from '@/constants/ui';
import { createContext, useState, type ReactNode } from 'react';

export type NavLayout = 'sidebar' | 'header';

export interface NavLayoutContextValue {
  /** User's preferred nav layout. Falls back to the sidebar automatically on
   * screens too narrow to fit a horizontal nav (see useEffectiveNavLayout). */
  navLayout: NavLayout;
  setNavLayout: (value: NavLayout) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const NavLayoutContext = createContext<NavLayoutContextValue>({
  navLayout: 'sidebar',
  setNavLayout: () => {},
});

function loadNavLayout(): NavLayout {
  if (typeof window === 'undefined') return 'sidebar';
  return window.localStorage.getItem(STORAGE_KEY.NAV_LAYOUT) === 'header'
    ? 'header'
    : 'sidebar';
}

export function NavLayoutProvider({ children }: { children: ReactNode }) {
  const [navLayout, setNavLayoutState] = useState<NavLayout>(loadNavLayout);

  const setNavLayout = (value: NavLayout) => {
    setNavLayoutState(value);
    window.localStorage.setItem(STORAGE_KEY.NAV_LAYOUT, value);
  };

  return (
    <NavLayoutContext.Provider value={{ navLayout, setNavLayout }}>
      {children}
    </NavLayoutContext.Provider>
  );
}
