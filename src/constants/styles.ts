import type { CSSProperties } from 'react';

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
  minWidth: 'max-content',
  whiteSpace: 'nowrap',
} as const satisfies CSSProperties;

export const RICH_TEXT_BADGE_STYLE = {
  verticalAlign: 'middle',
} as const satisfies CSSProperties;

type CardHoverPropsOptions = {
  interactive?: boolean;
  style?: CSSProperties;
};

type CharacterPortraitHoverOptions = {
  isSubstitute?: boolean;
};

/**
 * Returns the shared surface class and, for genuinely interactive surfaces,
 * opts into pointer and elevation affordances.
 */
export function getCardHoverProps(options: CardHoverPropsOptions = {}) {
  const { interactive = false, style } = options;
  const className = interactive
    ? 'card-hover card-hover-interactive'
    : 'card-surface-static';
  return style ? { className, style } : { className };
}

/**
 * Returns a CSS class for character portrait hover effect (scale + shadow).
 * Actual transitions are handled by `.portrait-hover` in interactions.css.
 */
export function getCharacterPortraitHoverProps(
  options: CharacterPortraitHoverOptions = {}
) {
  const { isSubstitute = false } = options;
  return {
    className: isSubstitute
      ? 'portrait-hover portrait-hover-substitute'
      : 'portrait-hover',
  };
}

/** Shared base for all Mantine Tooltip `styles` objects. */
const TOOLTIP_BASE = {
  tooltip: {
    backgroundColor: 'var(--mantine-color-body)',
    color: 'var(--mantine-color-text)',
    border: '1px solid var(--mantine-color-default-border)',
  },
  arrow: {
    backgroundColor: 'var(--mantine-color-body)',
    border: '1px solid var(--mantine-color-default-border)',
  },
} as const;

/**
 * Tooltip styles for detail pages (skill/gear/status effect tooltips)
 */
export const DETAIL_TOOLTIP_STYLES = {
  tooltip: {
    ...TOOLTIP_BASE.tooltip,
    boxShadow: 'var(--mantine-shadow-sm)',
    padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
  },
  arrow: TOOLTIP_BASE.arrow,
};

/**
 * Larger tooltip styles for rich content (gear/set bonus previews)
 */
export const RICH_TOOLTIP_STYLES = {
  tooltip: {
    ...TOOLTIP_BASE.tooltip,
    boxShadow: 'var(--mantine-shadow-md)',
    borderRadius: 'var(--mantine-radius-md)',
    padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
  },
  arrow: TOOLTIP_BASE.arrow,
};

export const LINK_BLOCK_RESET_STYLE = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
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

/** Shrinks a table column to its content width. Apply to Th/Td alongside a full-width description column. */
export const COMPACT_COL_STYLE = {
  whiteSpace: 'nowrap',
  width: '1%',
} as const satisfies CSSProperties;

export const CURSOR_POINTER_STYLE = {
  cursor: 'pointer',
} as const satisfies CSSProperties;

export const CURSOR_DEFAULT_STYLE = {
  cursor: 'default',
} as const satisfies CSSProperties;

export function getMinWidthStyle(minWidth: number): CSSProperties {
  return { minWidth };
}

