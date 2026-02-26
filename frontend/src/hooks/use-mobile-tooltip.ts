import { useMediaQuery } from '@mantine/hooks';

/**
 * Hook to determine if tooltips should be interactive on touch devices
 * On mobile/touch devices, returns openDelay and closeDelay to make tooltips easier to interact with
 * On desktop, returns default behavior
 */
export function useMobileTooltip() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      (navigator &&
        'maxTouchPoints' in navigator &&
        navigator.maxTouchPoints > 0));

  // On mobile/touch devices, open quickly and stay visible a bit longer.
  // Also enable the touch event so tapping triggers the tooltip.
  if (isMobile || isTouchDevice) {
    return {
      openDelay: 80,
      closeDelay: 260,
      withArrow: true,
      position: 'top' as const,
      events: { hover: true, focus: true, touch: true },
    };
  }

  // Desktop behavior - quick feedback without the old lag.
  return {
    openDelay: 120,
    closeDelay: 120,
    withArrow: true,
    position: 'top' as const,
  };
}
