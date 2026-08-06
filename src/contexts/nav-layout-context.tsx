import { STORAGE_KEY } from '@/constants/ui';
import { useState, type ReactNode } from 'react';
import { NavLayoutContext, type NavLayout } from './nav-layout';

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
