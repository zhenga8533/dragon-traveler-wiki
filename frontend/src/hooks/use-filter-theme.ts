import { useGradientAccent } from './use-gradient-accent';

export function useFilterTheme() {
  const { accent } = useGradientAccent();
  const searchIconColor = `var(--mantine-color-${accent.primary}-6)`;

  return {
    accent,
    searchIconColor,
  };
}
