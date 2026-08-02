import { Paper, type PaperProps } from '@mantine/core';
import type { ComponentType, ElementType, ReactNode } from 'react';

export interface StaticSurfaceProps extends PaperProps {
  component?: ElementType;
  children?: ReactNode;
  href?: string;
  id?: string;
  to?: string;
}

export interface InteractiveSurfaceProps extends StaticSurfaceProps {
  'aria-label'?: string;
}

const SurfacePaper = Paper as unknown as ComponentType<StaticSurfaceProps>;

export const STATIC_SURFACE_CLASS_NAME = 'card-surface-static';
export const INTERACTIVE_SURFACE_CLASS_NAME =
  'card-hover card-hover-interactive';

/**
 * Standard non-interactive application surface.
 *
 * Use this for ordinary content panels/cards that should follow the selected
 * palette and the Settings > Opacity > UI Surfaces slider.
 */
export function StaticSurface({
  component,
  className,
  ...props
}: StaticSurfaceProps) {
  return (
    <SurfacePaper
      component={component ?? 'div'}
      className={[STATIC_SURFACE_CLASS_NAME, className]
        .filter(Boolean)
        .join(' ')}
      radius="md"
      withBorder
      {...props}
    />
  );
}

/**
 * Surface for links, buttons, and other keyboard-operable controls.
 *
 * Use this when the whole panel is clickable/focusable and should get the
 * shared hover/elevation treatment.
 */
export function InteractiveSurface({
  component,
  className,
  ...props
}: InteractiveSurfaceProps) {
  return (
    <SurfacePaper
      component={component ?? 'a'}
      className={[INTERACTIVE_SURFACE_CLASS_NAME, className]
        .filter(Boolean)
        .join(' ')}
      radius="md"
      withBorder
      {...props}
    />
  );
}
