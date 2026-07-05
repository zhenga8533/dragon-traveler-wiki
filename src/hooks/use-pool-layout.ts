import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { BREAKPOINTS, STORAGE_KEY } from '@/constants/ui';

export type PoolLayout = 'below' | 'side';

/**
 * Shared toggle for the character pool layout in the team/tier-list builders.
 * Side-by-side is only offered on wide viewports, since the pool needs its
 * own column alongside the builder's main content to stay usable.
 */
export function usePoolLayout() {
  const canUseSideLayout = useMediaQuery(BREAKPOINTS.LG) ?? false;
  const [preferred, setPreferred] = useState<PoolLayout>(() => {
    if (typeof window === 'undefined') return 'below';
    return window.localStorage.getItem(STORAGE_KEY.BUILDER_POOL_LAYOUT) ===
      'side'
      ? 'side'
      : 'below';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.BUILDER_POOL_LAYOUT, preferred);
  }, [preferred]);

  const layout: PoolLayout = canUseSideLayout ? preferred : 'below';

  return { layout, setLayout: setPreferred, canUseSideLayout };
}
