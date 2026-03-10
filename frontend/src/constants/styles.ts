import type { CSSProperties } from 'react';
import { getGlassStyles } from './glass';
import { TRANSITION } from './ui';

export const BRAND_TITLE_STYLE = {
  fontFamily: '"Space Grotesk", "Plus Jakarta Sans", system-ui, sans-serif',
  letterSpacing: '0.02em',
  fontWeight: 700,
  backgroundImage: 'var(--dt-brand-gradient)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
} as const satisfies CSSProperties;

export const TAG_BADGE_STYLE = {
  flexShrink: 0,
  maxWidth: 'max-content',
  whiteSpace: 'nowrap',
} as const satisfies CSSProperties;

type CardHoverPropsOptions = {
  interactive?: boolean;
  style?: CSSProperties;
};

type CharacterPortraitHoverOptions = {
  isSubstitute?: boolean;
  style?: CSSProperties;
};

/**
 * Returns className (and optional style) for card hover effect.
 * The actual transition/lift is handled by `.card-hover` in themed-cards.css.
 * withBorder Paper/Card elements get hover automatically via CSS selectors there.
 */
export function getCardHoverProps(options: CardHoverPropsOptions = {}) {
  const { interactive = false, style } = options;
  const className = interactive
    ? 'card-hover card-hover-interactive'
    : 'card-hover';
  return style ? { className, style } : { className };
}

export function getCharacterPortraitHoverProps(
  options: CharacterPortraitHoverOptions = {}
) {
  const { isSubstitute = false, style } = options;
  const baseShadow = isSubstitute
    ? '0 1px 4px rgba(0,0,0,0.16)'
    : '0 2px 6px rgba(0,0,0,0.2)';
  const hoverShadow = isSubstitute
    ? '0 3px 8px rgba(0,0,0,0.2)'
    : '0 4px 10px rgba(0,0,0,0.25)';

  return {
    style: {
      boxShadow: baseShadow,
      opacity: isSubstitute ? 0.9 : 1,
      transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}, box-shadow ${TRANSITION.FAST} ${TRANSITION.EASE}`,
      ...style,
    } as CSSProperties,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = 'scale(1.08)';
      e.currentTarget.style.boxShadow = hoverShadow;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = baseShadow;
    },
  };
}

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

export const LINK_BLOCK_RESET_STYLE = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
} as const satisfies CSSProperties;

export const LINK_FIT_CONTENT_RESET_STYLE = {
  textDecoration: 'none',
  width: 'fit-content',
} as const satisfies CSSProperties;

/** Flex layout for an anchor containing an icon + text label */
export const ICON_TEXT_FLEX_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
} as const satisfies CSSProperties;

export const WHITE_SPACE_PRE_LINE_STYLE = {
  whiteSpace: 'pre-line',
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
    ? 'var(--dt-home-hero-gradient-dark)'
    : 'var(--dt-home-hero-gradient-light)';
}

export const HOME_HERO_TITLE_STYLE = {
  fontFamily: BRAND_TITLE_STYLE.fontFamily,
  letterSpacing: BRAND_TITLE_STYLE.letterSpacing,
  fontWeight: 700,
  fontSize: 'clamp(2rem, 6vw, 3.5rem)',
} as const satisfies CSSProperties;

export function getHomeHeroWordmarkStyle(isDark: boolean): CSSProperties {
  return {
    color: isDark
      ? 'var(--dt-wordmark-color-dark)'
      : 'var(--dt-wordmark-color-light)',
    textShadow: isDark
      ? 'var(--dt-wordmark-shadow-dark)'
      : 'var(--dt-wordmark-shadow-light)',
  };
}

export function getHomeHeroSubtitleStyle(isDark: boolean): CSSProperties {
  return {
    color: isDark
      ? 'var(--mantine-color-gray-1)'
      : 'var(--mantine-color-dark-8)',
    fontWeight: 500,
    textShadow: isDark ? '0 1px 6px rgba(0, 0, 0, 0.9)' : 'none',
  };
}

export function getHomeHeroMetaTextStyle(isDark: boolean): CSSProperties {
  return {
    color: isDark
      ? 'var(--mantine-color-gray-2)'
      : 'var(--mantine-color-dark-6)',
    textShadow: isDark ? '0 1px 4px rgba(0, 0, 0, 0.85)' : 'none',
  };
}

export function getHomeHeroPlayNowStyle(isDark: boolean): CSSProperties {
  return {
    borderColor: isDark
      ? 'rgba(255, 255, 255, 0.4)'
      : 'var(--mantine-color-gray-4)',
    color: isDark ? 'rgba(255, 255, 255, 0.95)' : 'var(--mantine-color-dark-8)',
    backdropFilter: 'blur(4px)',
    backgroundColor: isDark
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(255, 255, 255, 0.78)',
    whiteSpace: 'nowrap',
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
