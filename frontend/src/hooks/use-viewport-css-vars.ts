import { useEffect } from 'react';

type OrientationKey = 'portrait' | 'landscape';

function getOrientationKey(): OrientationKey {
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

export function useViewportCssVars() {
  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;

    if (!visualViewport) {
      root.style.setProperty('--app-viewport-height', '100dvh');
      root.style.setProperty('--app-viewport-bottom-offset', '0px');
      return;
    }

    const maxVisibleBottomByOrientation: Record<OrientationKey, number> = {
      portrait: 0,
      landscape: 0,
    };

    const updateViewportVars = () => {
      const orientation = getOrientationKey();
      const visibleBottom = visualViewport.height + visualViewport.offsetTop;

      maxVisibleBottomByOrientation[orientation] = Math.max(
        maxVisibleBottomByOrientation[orientation],
        visibleBottom
      );

      const viewportBottomOffset = Math.max(
        0,
        maxVisibleBottomByOrientation[orientation] - visibleBottom
      );

      root.style.setProperty(
        '--app-viewport-height',
        `${Math.round(visualViewport.height)}px`
      );
      root.style.setProperty(
        '--app-viewport-bottom-offset',
        `${Math.round(viewportBottomOffset)}px`
      );
    };

    updateViewportVars();

    visualViewport.addEventListener('resize', updateViewportVars);
    visualViewport.addEventListener('scroll', updateViewportVars);
    window.addEventListener('resize', updateViewportVars);
    window.addEventListener('orientationchange', updateViewportVars);

    return () => {
      visualViewport.removeEventListener('resize', updateViewportVars);
      visualViewport.removeEventListener('scroll', updateViewportVars);
      window.removeEventListener('resize', updateViewportVars);
      window.removeEventListener('orientationchange', updateViewportVars);
      root.style.removeProperty('--app-viewport-height');
      root.style.removeProperty('--app-viewport-bottom-offset');
    };
  }, []);
}
