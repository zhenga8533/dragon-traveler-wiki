import { useContext } from 'react';
import {
  GRADIENT_PALETTE_ACCENTS,
  GradientThemeContext,
  type GradientPaletteAccents,
} from '@/contexts';

export function useGradientAccent() {
  const { palette, setPalette, customColors, setCustomColors } =
    useContext(GradientThemeContext);

  const accent: GradientPaletteAccents =
    palette === 'custom'
      ? {
          primary: customColors.mantineAccent,
          secondary: customColors.mantineAccent as GradientPaletteAccents['secondary'],
          tertiary: customColors.mantineAccent as GradientPaletteAccents['tertiary'],
        }
      : GRADIENT_PALETTE_ACCENTS[palette];

  return { accent, palette, setPalette, customColors, setCustomColors };
}
