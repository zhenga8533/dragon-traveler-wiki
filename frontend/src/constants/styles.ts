import type { CSSProperties } from 'react';
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
