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

  // On mobile/touch devices, keep tooltip open longer and add delay for user interaction
  if (isMobile || isTouchDevice) {
    return {
      openDelay: 100,
      closeDelay: 400,
      withArrow: true,
      position: 'top' as const,
    };
  }

  // Desktop behavior - standard hover
  return {
    openDelay: 500,
    closeDelay: 100,
    withArrow: false,
    position: 'top' as const,
  };
}
