import { useContext } from 'react';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../contexts';

export function useGradientAccent() {
  const { palette, setPalette } = useContext(GradientThemeContext);
  return { accent: GRADIENT_PALETTE_ACCENTS[palette], palette, setPalette };
}
