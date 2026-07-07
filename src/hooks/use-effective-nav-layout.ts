import { useContext } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINTS } from '@/constants/ui';
import { NavLayoutContext } from '@/contexts';

/**
 * The nav layout actually rendered. A horizontal header nav doesn't fit
 * below ~1200px alongside the logo, search, and settings controls, so this
 * falls back to the sidebar there regardless of the user's preference.
 */
export function useEffectiveNavLayout() {
  const { navLayout, setNavLayout } = useContext(NavLayoutContext);
  const isWideEnough = useMediaQuery(BREAKPOINTS.LG) ?? false;
  const effectiveNavLayout =
    navLayout === 'header' && isWideEnough ? 'header' : 'sidebar';

  return { navLayout, setNavLayout, effectiveNavLayout };
}
