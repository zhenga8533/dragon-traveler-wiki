import type { CSSProperties } from 'react';
import { GLASS_ICON_BG } from './glass';

export const DETAIL_HERO_WRAPPER_STYLES = {
  position: 'relative' as const,
  overflow: 'hidden' as const,
  background: 'var(--mantine-color-body)',
  margin:
    'calc(-1 * var(--mantine-spacing-md)) calc(-1 * var(--mantine-spacing-md)) 0',
  padding: 'var(--mantine-spacing-md) var(--mantine-spacing-md) 0',
};

/**
 * Radial gradient background for detail page hero sections.
 * @param isDark - current color scheme
 * @param primaryColor - Mantine color name for the primary accent
 * @param secondaryColor - Mantine color name for the secondary accent (default: 'violet')
 * @param opacity - opacity values for dark and light modes (default: { dark: 0.7, light: 0.9 })
 */
export function getDetailHeroGradient(
  isDark: boolean,
  primaryColor: string,
  secondaryColor = 'violet',
  opacity = { dark: 0.7, light: 0.9 },
) {
  const fadeStop = '58%';

  return {
    position: 'absolute' as const,
    inset: 0,
    background: isDark
      ? `radial-gradient(ellipse at 30% 20%, var(--mantine-color-${primaryColor}-9) 0%, transparent ${fadeStop}),
         radial-gradient(ellipse at 70% 80%, var(--mantine-color-${secondaryColor}-9) 0%, transparent ${fadeStop}),
         var(--mantine-color-dark-8)`
      : `radial-gradient(ellipse at 30% 20%, var(--mantine-color-${primaryColor}-1) 0%, transparent ${fadeStop}),
         radial-gradient(ellipse at 70% 80%, var(--mantine-color-${secondaryColor}-1) 0%, transparent ${fadeStop}),
         var(--mantine-color-gray-0)`,
    opacity: isDark ? opacity.dark : opacity.light,
  };
}

/**
 * 96×96 icon box for detail page hero sections.
 * @param isDark - current color scheme
 * @param color - Mantine color name for the border and shadow
 * @param circle - use circular shape instead of rounded square (default: false)
 */
export function getHeroIconBoxStyles(
  isDark: boolean,
  color: string,
  circle = false,
): CSSProperties {
  return {
    width: 96,
    height: 96,
    flexShrink: 0,
    borderRadius: circle ? '50%' : 'var(--mantine-radius-md)',
    background: isDark ? GLASS_ICON_BG.dark : GLASS_ICON_BG.light,
    border: `3px solid var(--mantine-color-${color}-${isDark ? 7 : 4})`,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    boxShadow: `0 4px 24px var(--mantine-color-${color}-${isDark ? 9 : 2})`,
  };
}
