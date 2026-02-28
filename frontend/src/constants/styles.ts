import type { CSSProperties } from 'react';
import { getGlassStyles } from './glass';
import { TRANSITION } from './ui';

export const BRAND_TITLE_STYLE = {
  fontFamily: '"Space Grotesk", "Plus Jakarta Sans", system-ui, sans-serif',
  letterSpacing: '0.02em',
  fontWeight: 700,
  backgroundImage:
    'linear-gradient(120deg, var(--mantine-color-violet-4) 0%, var(--mantine-color-violet-6) 45%, var(--mantine-color-grape-6) 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
} as const satisfies CSSProperties;

/**
 * Consistent hover effect styles for interactive cards
 */
export const CARD_HOVER_STYLES = {
  transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}, box-shadow ${TRANSITION.FAST} ${TRANSITION.EASE}`,
  cursor: 'pointer',
} as const satisfies CSSProperties;

export const cardHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '';
  },
};

type CardHoverPropsOptions = {
  interactive?: boolean;
  style?: CSSProperties;
};

export function getCardHoverProps(options: CardHoverPropsOptions = {}) {
  const { interactive = false, style } = options;
  return {
    style: {
      ...CARD_HOVER_STYLES,
      cursor: interactive ? 'pointer' : 'default',
      ...style,
    } as CSSProperties,
    ...cardHoverHandlers,
  };
}

/**
 * Subtle glow effect for cards (use with hover)
 */
export const cardGlowHandlers = (color: string = 'violet') => ({
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = `var(--mantine-shadow-md), 0 0 20px var(--mantine-color-${color}-light)`;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '';
  },
});

/**
 * Tooltip styles for detail pages (skill/gear/status effect tooltips)
 */
export const DETAIL_TOOLTIP_STYLES = {
  tooltip: {
    backgroundColor: 'var(--mantine-color-body)',
    color: 'var(--mantine-color-text)',
    border: '1px solid var(--mantine-color-default-border)',
    boxShadow: 'var(--mantine-shadow-sm)',
    padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
  },
  arrow: {
    backgroundColor: 'var(--mantine-color-body)',
    border: '1px solid var(--mantine-color-default-border)',
  },
};

/**
 * Larger tooltip styles for rich content (gear/set bonus previews)
 */
export const RICH_TOOLTIP_STYLES = {
  tooltip: {
    backgroundColor: 'var(--mantine-color-default)',
    color: 'var(--mantine-color-text)',
    border: '1px solid var(--mantine-color-default-border)',
    boxShadow: 'var(--mantine-shadow-md)',
    borderRadius: 'var(--mantine-radius-sm)',
    padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
  },
  arrow: {
    backgroundColor: 'var(--mantine-color-default)',
    border: '1px solid var(--mantine-color-default-border)',
  },
};

/**
 * Shared hero section wrapper for detail pages (Artifact, NoblePhantasm, GearSet, Team)
 */
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
  opacity = { dark: 0.7, light: 0.9 }
) {
  return {
    position: 'absolute' as const,
    inset: 0,
    background: isDark
      ? `radial-gradient(ellipse at 30% 20%, var(--mantine-color-${primaryColor}-9) 0%, transparent 50%),
         radial-gradient(ellipse at 70% 80%, var(--mantine-color-${secondaryColor}-9) 0%, transparent 50%),
         var(--mantine-color-dark-8)`
      : `radial-gradient(ellipse at 30% 20%, var(--mantine-color-${primaryColor}-1) 0%, transparent 50%),
         radial-gradient(ellipse at 70% 80%, var(--mantine-color-${secondaryColor}-1) 0%, transparent 50%),
         var(--mantine-color-gray-0)`,
    opacity: isDark ? opacity.dark : opacity.light,
  };
}

export const LINK_BLOCK_RESET_STYLE = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
} as const satisfies CSSProperties;

/**
 * Shared section card style used across guide pages.
 */
export function getGuideSectionCardStyles(isDark: boolean): CSSProperties {
  return {
    ...getGlassStyles(isDark, true),
    boxShadow: isDark
      ? '0 10px 28px rgba(0, 0, 0, 0.28)'
      : '0 8px 24px rgba(124, 58, 237, 0.08)',
  };
}

export function getMinWidthStyle(minWidth: number): CSSProperties {
  return { minWidth };
}

export function getHomeHeroPlaceholderGradient(isDark: boolean): string {
  return isDark
    ? 'linear-gradient(135deg, var(--mantine-color-violet-9) 0%, var(--mantine-color-grape-9) 35%, var(--mantine-color-pink-9) 65%, var(--mantine-color-violet-9) 100%)'
    : 'linear-gradient(135deg, var(--mantine-color-violet-1) 0%, var(--mantine-color-grape-2) 35%, var(--mantine-color-pink-3) 65%, var(--mantine-color-violet-1) 100%)';
}

export const HOME_HERO_TITLE_STYLE = {
  fontFamily: BRAND_TITLE_STYLE.fontFamily,
  letterSpacing: BRAND_TITLE_STYLE.letterSpacing,
  fontWeight: 700,
  fontSize: 'clamp(2rem, 6vw, 3.5rem)',
  textShadow:
    '0 2px 16px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.35)',
} as const satisfies CSSProperties;

export const HOME_HERO_WORDMARK_STYLE = {
  background:
    'linear-gradient(135deg, var(--mantine-color-pink-2) 0%, var(--mantine-color-violet-2) 45%, var(--mantine-color-blue-2) 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'var(--mantine-color-white)',
} as const satisfies CSSProperties;

export const HOME_HERO_SUBTITLE_STYLE = {
  color: 'rgba(255, 255, 255, 0.92)',
  fontWeight: 500,
  textShadow: '0 1px 6px rgba(0, 0, 0, 0.9)',
} as const satisfies CSSProperties;

export const HOME_HERO_META_TEXT_STYLE = {
  color: 'rgba(255, 255, 255, 0.9)',
  textShadow: '0 1px 4px rgba(0, 0, 0, 0.85)',
} as const satisfies CSSProperties;

export const HOME_HERO_PLAY_NOW_STYLE = {
  borderColor: 'rgba(255, 255, 255, 0.4)',
  color: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(4px)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  whiteSpace: 'nowrap',
} as const satisfies CSSProperties;

/**
 * 96×96 icon box for detail page hero sections.
 * @param isDark - current color scheme
 * @param color - Mantine color name for the border and shadow
 * @param circle - use circular shape instead of rounded square (default: false)
 */
export function getHeroIconBoxStyles(
  isDark: boolean,
  color: string,
  circle = false
) {
  return {
    width: 96,
    height: 96,
    flexShrink: 0,
    borderRadius: circle ? '50%' : 12,
    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
    border: `3px solid var(--mantine-color-${color}-${isDark ? 7 : 4})`,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    boxShadow: `0 4px 24px var(--mantine-color-${color}-${isDark ? 9 : 2})`,
  };
}
