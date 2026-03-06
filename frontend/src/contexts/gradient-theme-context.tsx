import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEY } from '../constants/ui';
import {
  DEFAULT_PALETTE,
  GradientThemeContext,
  normalizePalette,
  type GradientPalette,
} from './gradient-theme';

export function GradientThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<GradientPalette>(() => {
    if (typeof window === 'undefined') return DEFAULT_PALETTE;
    return normalizePalette(
      window.localStorage.getItem(STORAGE_KEY.GRADIENT_PALETTE)
    );
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.GRADIENT_PALETTE, palette);
    document.documentElement.setAttribute('data-gradient-palette', palette);
  }, [palette]);

  const contextValue = useMemo(
    () => ({
      palette,
      setPalette,
    }),
    [palette]
  );

  return (
    <GradientThemeContext.Provider value={contextValue}>
      {children}
    </GradientThemeContext.Provider>
  );
}
