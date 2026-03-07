import { useContext } from 'react';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../contexts';

export function useFilterTheme() {
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
  const searchIconColor = `var(--mantine-color-${accent.primary}-6)`;

  return {
    accent,
    searchIconColor,
  };
}
