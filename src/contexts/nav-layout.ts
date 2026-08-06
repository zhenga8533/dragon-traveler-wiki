import { createContext } from 'react';

export type NavLayout = 'sidebar' | 'header';

export interface NavLayoutContextValue {
  navLayout: NavLayout;
  setNavLayout: (value: NavLayout) => void;
}

export const NavLayoutContext = createContext<NavLayoutContextValue>({
  navLayout: 'sidebar',
  setNavLayout: () => {},
});
