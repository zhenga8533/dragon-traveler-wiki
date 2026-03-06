import { createContext } from 'react';

export type GradientPalette =
  | 'violet'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'ember'
  | 'dusk'
  | 'frost'
  | 'blossom';

export interface GradientPaletteAccents {
  primary: 'violet' | 'teal' | 'orange' | 'green' | 'red';
  secondary: 'grape' | 'cyan' | 'pink' | 'lime' | 'teal' | 'orange';
  tertiary: 'pink' | 'orange' | 'yellow' | 'teal' | 'lime';
}

export const GRADIENT_PALETTE_ACCENTS: Record<
  GradientPalette,
  GradientPaletteAccents
> = {
  violet: {
    primary: 'violet',
    secondary: 'grape',
    tertiary: 'pink',
  },
  ocean: {
    primary: 'teal',
    secondary: 'cyan',
    tertiary: 'orange',
  },
  sunset: {
    primary: 'orange',
    secondary: 'pink',
    tertiary: 'yellow',
  },
  forest: {
    primary: 'green',
    secondary: 'teal',
    tertiary: 'lime',
  },
  ember: {
    primary: 'red',
    secondary: 'orange',
    tertiary: 'pink',
  },
  dusk: {
    primary: 'violet',
    secondary: 'orange',
    tertiary: 'teal',
  },
  frost: {
    primary: 'teal',
    secondary: 'cyan',
    tertiary: 'lime',
  },
  blossom: {
    primary: 'red',
    secondary: 'pink',
    tertiary: 'orange',
  },
};

export interface GradientThemeContextValue {
  palette: GradientPalette;
  setPalette: (palette: GradientPalette) => void;
}

export const DEFAULT_PALETTE: GradientPalette = 'violet';

export function normalizePalette(value: unknown): GradientPalette {
  if (value === 'ocean') return 'ocean';
  if (value === 'sunset') return 'sunset';
  if (value === 'forest') return 'forest';
  if (value === 'ember') return 'ember';
  if (value === 'dusk') return 'dusk';
  if (value === 'frost') return 'frost';
  if (value === 'blossom') return 'blossom';
  return DEFAULT_PALETTE;
}

export const GradientThemeContext = createContext<GradientThemeContextValue>({
  palette: DEFAULT_PALETTE,
  setPalette: () => {
    /* noop */
  },
});
