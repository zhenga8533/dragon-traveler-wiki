import { useComputedColorScheme } from '@mantine/core';

export function useDarkMode() {
  return useComputedColorScheme('light') === 'dark';
}
