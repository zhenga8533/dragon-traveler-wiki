import { Paper, type PaperProps } from '@mantine/core';
import { forwardRef } from 'react';
import type {
  ComponentType,
  ElementType,
  ReactNode,
  RefAttributes,
} from 'react';

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

const SurfacePaper = Paper as unknown as ComponentType<
  StaticSurfaceProps & RefAttributes<HTMLElement>
>;

export const STATIC_SURFACE_CLASS_NAME = 'card-surface-static';
export const INTERACTIVE_SURFACE_CLASS_NAME =
  'card-hover card-hover-interactive';

/**
 * Standard non-interactive application surface.
 *
 * Use this for ordinary content panels/cards that should follow the selected
 * palette and the Settings > Opacity > UI Surfaces slider.
 */
export const StaticSurface = forwardRef<HTMLElement, StaticSurfaceProps>(
  function StaticSurface({ component, className, ...props }, ref) {
    return (
      <SurfacePaper
        ref={ref}
        component={component ?? 'div'}
        className={[STATIC_SURFACE_CLASS_NAME, className]
          .filter(Boolean)
          .join(' ')}
        radius="md"
        withBorder
        {...props}
      />
    );
  },
);

/**
 * Surface for links, buttons, and other keyboard-operable controls.
 *
 * Use this when the whole panel is clickable/focusable and should get the
 * shared hover/elevation treatment.
 */
export const InteractiveSurface = forwardRef<
  HTMLElement,
  InteractiveSurfaceProps
>(function InteractiveSurface({ component, className, ...props }, ref) {
  return (
    <SurfacePaper
      ref={ref}
      component={component ?? 'a'}
      className={[INTERACTIVE_SURFACE_CLASS_NAME, className]
        .filter(Boolean)
        .join(' ')}
      radius="md"
      withBorder
      {...props}
    />
  );
});
