/**
 * Glassmorphism style presets for consistent blur/transparency effects
 */

export const GLASS = {
  BLUR: '12px',
  BLUR_SUBTLE: '8px',
} as const;

export const GLASS_BORDER = {
  dark: '1px solid rgba(255, 255, 255, 0.08)',
  light: '1px solid rgba(0, 0, 0, 0.1)',
} as const;

function normalizeOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.min(1, Math.max(0, opacity));
}

/**
 * Subtle glass style for lore/description cards
 */
export function getLoreGlassStyles(isDark: boolean) {
  return {
    background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)',
    backdropFilter: `blur(${GLASS.BLUR_SUBTLE})`,
    border: isDark
      ? '1px solid rgba(255,255,255,0.06)'
      : '1px solid rgba(0,0,0,0.06)',
  };
}

/**
 * Get glassmorphism styles based on color scheme
 */
export function getGlassStyles(
  isDark: boolean,
  subtle = false,
  opacityOverride?: number
) {
  const defaultOpacity = subtle ? (isDark ? 0.75 : 0.7) : isDark ? 0.9 : 0.85;
  const opacity = normalizeOpacity(opacityOverride ?? defaultOpacity);

  return {
    backdropFilter: `blur(${GLASS.BLUR})`,
    WebkitBackdropFilter: `blur(${GLASS.BLUR})`,
    backgroundColor: isDark
      ? `rgba(20, 21, 23, ${opacity})`
      : `rgba(255, 255, 255, ${opacity})`,
    border: isDark ? GLASS_BORDER.dark : GLASS_BORDER.light,
  };
}
