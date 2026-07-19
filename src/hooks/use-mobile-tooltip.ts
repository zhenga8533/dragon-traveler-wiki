import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINTS } from '@/constants/ui';

/** Keep tap interactions from leaving focus-triggered tooltips open on touch devices. */
export function useMobileTooltip() {
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      (navigator &&
        'maxTouchPoints' in navigator &&
        navigator.maxTouchPoints > 0));

  if (isMobile || isTouchDevice) {
    return {
      openDelay: 0,
      closeDelay: 0,
      withArrow: true,
      position: 'top' as const,
      events: { hover: false, focus: false, touch: false },
    };
  }

  return {
    openDelay: 120,
    closeDelay: 120,
    withArrow: true,
    position: 'top' as const,
    events: { hover: true, focus: true, touch: false },
  };
}
