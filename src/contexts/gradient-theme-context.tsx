import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEY } from '@/constants/ui';
import {
  DEFAULT_CUSTOM_COLORS,
  DEFAULT_PALETTE,
  GradientThemeContext,
  normalizePalette,
  type CustomGradientColors,
  type GradientPalette,
} from './gradient-theme';

// CSS custom properties injected when palette === 'custom'
const CUSTOM_CSS_VARS = [
  '--dt-brand-gradient',
  '--dt-home-hero-gradient-dark',
  '--dt-home-hero-gradient-light',
  '--dt-surface-glow-a',
  '--dt-surface-glow-b',
  '--dt-focus-ring',
  '--dt-focus-border',
  '--dt-wordmark-color-dark',
  '--dt-wordmark-color-light',
  '--dt-wordmark-shadow-dark',
  '--dt-wordmark-shadow-light',
  '--dt-link-color-light',
  '--dt-link-color-dark',
  '--dt-home-hero-panel-light',
  '--dt-home-hero-panel-dark',
  '--dt-home-hero-card-light',
  '--dt-home-hero-card-dark',
  ...Array.from({ length: 10 }, (_, i) => `--mantine-primary-color-${i}`),
  '--mantine-primary-color-filled',
  '--mantine-primary-color-filled-hover',
  '--mantine-primary-color-light',
  '--mantine-primary-color-light-hover',
  '--mantine-primary-color-light-color',
  '--mantine-primary-color-contrast',
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function isValidHex(hex: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(hex);
}

function injectCustomCssVars(colors: CustomGradientColors) {
  if (!isValidHex(colors.colorA) || !isValidHex(colors.colorB)) return;
  const root = document.documentElement;
  const [rA, gA, bA] = hexToRgb(colors.colorA);
  const [rB, gB, bB] = hexToRgb(colors.colorB);
  const acc = colors.mantineAccent;

  root.style.setProperty(
    '--dt-brand-gradient',
    `linear-gradient(120deg, ${colors.colorA} 0%, ${colors.colorB} 100%)`
  );
  root.style.setProperty(
    '--dt-home-hero-gradient-dark',
    `linear-gradient(135deg, rgba(${rA},${gA},${bA},0.55) 0%, rgba(${rB},${gB},${bB},0.45) var(--dt-home-hero-stop-mid), rgba(${rA},${gA},${bA},0.35) 100%)`
  );
  root.style.setProperty(
    '--dt-home-hero-gradient-light',
    `linear-gradient(135deg, rgba(${rA},${gA},${bA},0.12) 0%, rgba(${rB},${gB},${bB},0.1) var(--dt-home-hero-stop-mid), rgba(${rA},${gA},${bA},0.07) 100%)`
  );
  root.style.setProperty('--dt-surface-glow-a', `rgba(${rA},${gA},${bA},0.32)`);
  root.style.setProperty('--dt-surface-glow-b', `rgba(${rB},${gB},${bB},0.22)`);
  root.style.setProperty('--dt-focus-ring', `rgba(${rA},${gA},${bA},0.48)`);
  root.style.setProperty('--dt-focus-border', colors.colorA);
  root.style.setProperty('--dt-wordmark-color-dark', colors.colorA);
  root.style.setProperty('--dt-wordmark-color-light', colors.colorB);
  root.style.setProperty(
    '--dt-wordmark-shadow-dark',
    `0 1px 12px rgba(${rA},${gA},${bA},0.42)`
  );
  root.style.setProperty(
    '--dt-wordmark-shadow-light',
    `0 1px 6px rgba(${rB},${gB},${bB},0.18)`
  );
  root.style.setProperty('--dt-link-color-light', colors.colorB);
  root.style.setProperty('--dt-link-color-dark', colors.colorA);
  root.style.setProperty(
    '--dt-home-hero-panel-light',
    `linear-gradient(180deg, rgba(${rA},${gA},${bA},0.08) 0%, rgba(${rB},${gB},${bB},0.06) 100%)`
  );
  root.style.setProperty(
    '--dt-home-hero-panel-dark',
    `linear-gradient(180deg, rgba(${rA},${gA},${bA},0.3) 0%, rgba(${rB},${gB},${bB},0.22) 100%)`
  );
  root.style.setProperty('--dt-home-hero-card-light', `rgba(${rA},${gA},${bA},0.08)`);
  root.style.setProperty('--dt-home-hero-card-dark', `rgba(${rA},${gA},${bA},0.3)`);

  for (let i = 0; i <= 9; i++) {
    root.style.setProperty(`--mantine-primary-color-${i}`, `var(--mantine-color-${acc}-${i})`);
  }
  root.style.setProperty('--mantine-primary-color-filled', `var(--mantine-color-${acc}-filled)`);
  root.style.setProperty(
    '--mantine-primary-color-filled-hover',
    `var(--mantine-color-${acc}-filled-hover)`
  );
  root.style.setProperty('--mantine-primary-color-light', `var(--mantine-color-${acc}-light)`);
  root.style.setProperty(
    '--mantine-primary-color-light-hover',
    `var(--mantine-color-${acc}-light-hover)`
  );
  root.style.setProperty(
    '--mantine-primary-color-light-color',
    `var(--mantine-color-${acc}-light-color)`
  );
  root.style.setProperty(
    '--mantine-primary-color-contrast',
    `var(--mantine-color-${acc}-contrast)`
  );
}

function removeCustomCssVars() {
  const root = document.documentElement;
  for (const v of CUSTOM_CSS_VARS) {
    root.style.removeProperty(v);
  }
}

function loadCustomColors(): CustomGradientColors {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY.CUSTOM_GRADIENT_COLORS);
    if (!raw) return DEFAULT_CUSTOM_COLORS;
    const parsed = JSON.parse(raw) as Partial<CustomGradientColors>;
    const { colorA, colorB } = parsed;
    return {
      colorA: typeof colorA === 'string' && isValidHex(colorA) ? colorA : DEFAULT_CUSTOM_COLORS.colorA,
      colorB: typeof colorB === 'string' && isValidHex(colorB) ? colorB : DEFAULT_CUSTOM_COLORS.colorB,
      mantineAccent: parsed.mantineAccent ?? DEFAULT_CUSTOM_COLORS.mantineAccent,
    };
  } catch {
    return DEFAULT_CUSTOM_COLORS;
  }
}

export function GradientThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<GradientPalette>(() => {
    if (typeof window === 'undefined') return DEFAULT_PALETTE;
    return normalizePalette(window.localStorage.getItem(STORAGE_KEY.GRADIENT_PALETTE));
  });

  const [customColors, setCustomColors] = useState<CustomGradientColors>(() => {
    if (typeof window === 'undefined') return DEFAULT_CUSTOM_COLORS;
    return loadCustomColors();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.GRADIENT_PALETTE, palette);
    window.localStorage.setItem(STORAGE_KEY.CUSTOM_GRADIENT_COLORS, JSON.stringify(customColors));
    document.documentElement.setAttribute('data-gradient-palette', palette);
    if (palette === 'custom') {
      injectCustomCssVars(customColors);
    } else {
      removeCustomCssVars();
    }
  }, [palette, customColors]);

  const contextValue = useMemo(
    () => ({
      palette,
      setPalette,
      customColors,
      setCustomColors,
    }),
    [palette, customColors]
  );

  return (
    <GradientThemeContext.Provider value={contextValue}>
      {children}
    </GradientThemeContext.Provider>
  );
}
