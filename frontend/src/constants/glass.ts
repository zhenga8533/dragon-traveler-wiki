/**
 * Glassmorphism style presets for consistent blur/transparency effects
 */

export const GLASS = {
  BLUR: '12px',
  BLUR_STRONG: '20px',
  BLUR_SUBTLE: '8px',
} as const;

export const GLASS_BACKGROUND = {
  dark: 'rgba(20, 21, 23, 0.9)',
  light: 'rgba(255, 255, 255, 0.85)',
  darkSubtle: 'rgba(20, 21, 23, 0.75)',
  lightSubtle: 'rgba(255, 255, 255, 0.7)',
} as const;

export const GLASS_BORDER = {
  dark: '1px solid rgba(255, 255, 255, 0.08)',
  light: '1px solid rgba(0, 0, 0, 0.1)',
} as const;

/**
 * Get glassmorphism styles based on color scheme
 */
export function getGlassStyles(isDark: boolean, subtle = false) {
  return {
    backdropFilter: `blur(${GLASS.BLUR})`,
    WebkitBackdropFilter: `blur(${GLASS.BLUR})`,
    backgroundColor: subtle
      ? isDark
        ? GLASS_BACKGROUND.darkSubtle
        : GLASS_BACKGROUND.lightSubtle
      : isDark
        ? GLASS_BACKGROUND.dark
        : GLASS_BACKGROUND.light,
    border: isDark ? GLASS_BORDER.dark : GLASS_BORDER.light,
  };
}
