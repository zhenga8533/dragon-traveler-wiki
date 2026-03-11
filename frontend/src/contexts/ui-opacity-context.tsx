import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEY } from '@/constants/ui';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { UI_OPACITY_DEFAULTS, UiOpacityContext } from './ui-opacity';

type ThemeMode = 'dark' | 'light';

interface ThemeOpacitySettings {
  bannerMediaOpacity: number;
  bannerOverlayOpacity: number;
  surfaceOpacity: number;
}

type OpacityByTheme = Record<ThemeMode, ThemeOpacitySettings>;

const THEME_MODES: ThemeMode[] = ['dark', 'light'];

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function parseStoredOpacity(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return clampOpacity(Number.isNaN(parsed) ? fallback : parsed);
}

function getThemeOpacityStorageKey(baseKey: string, mode: ThemeMode): string {
  return `${baseKey}:${mode}`;
}

function getInitialOpacityByTheme(): OpacityByTheme {
  const fallback: ThemeOpacitySettings = {
    bannerMediaOpacity: UI_OPACITY_DEFAULTS.bannerMediaOpacity,
    bannerOverlayOpacity: UI_OPACITY_DEFAULTS.bannerOverlayOpacity,
    surfaceOpacity: UI_OPACITY_DEFAULTS.surfaceOpacity,
  };

  if (typeof window === 'undefined') {
    return {
      dark: fallback,
      light: fallback,
    };
  }

  const readOpacity = (
    key: string,
    mode: ThemeMode,
    defaultValue: number
  ): number => {
    const themedValue = window.localStorage.getItem(
      getThemeOpacityStorageKey(key, mode)
    );
    if (themedValue !== null) {
      return parseStoredOpacity(themedValue, defaultValue);
    }

    // Backward compatibility for users who already have non-themed opacity values.
    return parseStoredOpacity(window.localStorage.getItem(key), defaultValue);
  };

  const byMode = {} as OpacityByTheme;
  for (const mode of THEME_MODES) {
    byMode[mode] = {
      bannerMediaOpacity: readOpacity(
        STORAGE_KEY.UI_BANNER_MEDIA_OPACITY,
        mode,
        UI_OPACITY_DEFAULTS.bannerMediaOpacity
      ),
      bannerOverlayOpacity: readOpacity(
        STORAGE_KEY.UI_BANNER_OVERLAY_OPACITY,
        mode,
        UI_OPACITY_DEFAULTS.bannerOverlayOpacity
      ),
      surfaceOpacity: readOpacity(
        STORAGE_KEY.UI_SURFACE_OPACITY,
        mode,
        UI_OPACITY_DEFAULTS.surfaceOpacity
      ),
    };
  }

  return byMode;
}

export function UiOpacityProvider({ children }: { children: ReactNode }) {
  const isDark = useDarkMode();
  const activeMode: ThemeMode = isDark ? 'dark' : 'light';
  const [opacityByTheme, setOpacityByTheme] = useState<OpacityByTheme>(
    getInitialOpacityByTheme
  );

  const activeOpacity = opacityByTheme[activeMode];

  const setBannerMediaOpacity = useCallback(
    (value: number) => {
      const nextValue = clampOpacity(value);
      setOpacityByTheme((prev) => ({
        ...prev,
        [activeMode]: {
          ...prev[activeMode],
          bannerMediaOpacity: nextValue,
        },
      }));
    },
    [activeMode]
  );

  const setBannerOverlayOpacity = useCallback(
    (value: number) => {
      const nextValue = clampOpacity(value);
      setOpacityByTheme((prev) => ({
        ...prev,
        [activeMode]: {
          ...prev[activeMode],
          bannerOverlayOpacity: nextValue,
        },
      }));
    },
    [activeMode]
  );

  const setSurfaceOpacity = useCallback(
    (value: number) => {
      const nextValue = clampOpacity(value);
      setOpacityByTheme((prev) => ({
        ...prev,
        [activeMode]: {
          ...prev[activeMode],
          surfaceOpacity: nextValue,
        },
      }));
    },
    [activeMode]
  );

  const resetOpacitySettings = useCallback(() => {
    setOpacityByTheme((prev) => ({
      ...prev,
      [activeMode]: {
        bannerMediaOpacity: UI_OPACITY_DEFAULTS.bannerMediaOpacity,
        bannerOverlayOpacity: UI_OPACITY_DEFAULTS.bannerOverlayOpacity,
        surfaceOpacity: UI_OPACITY_DEFAULTS.surfaceOpacity,
      },
    }));
  }, [activeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    for (const mode of THEME_MODES) {
      window.localStorage.setItem(
        getThemeOpacityStorageKey(STORAGE_KEY.UI_BANNER_MEDIA_OPACITY, mode),
        String(opacityByTheme[mode].bannerMediaOpacity)
      );
      window.localStorage.setItem(
        getThemeOpacityStorageKey(STORAGE_KEY.UI_BANNER_OVERLAY_OPACITY, mode),
        String(opacityByTheme[mode].bannerOverlayOpacity)
      );
      window.localStorage.setItem(
        getThemeOpacityStorageKey(STORAGE_KEY.UI_SURFACE_OPACITY, mode),
        String(opacityByTheme[mode].surfaceOpacity)
      );
    }
  }, [opacityByTheme]);

  const value = useMemo(
    () => ({
      bannerMediaOpacity: activeOpacity.bannerMediaOpacity,
      setBannerMediaOpacity,
      bannerOverlayOpacity: activeOpacity.bannerOverlayOpacity,
      setBannerOverlayOpacity,
      surfaceOpacity: activeOpacity.surfaceOpacity,
      setSurfaceOpacity,
      resetOpacitySettings,
    }),
    [
      activeOpacity.bannerMediaOpacity,
      activeOpacity.bannerOverlayOpacity,
      activeOpacity.surfaceOpacity,
      resetOpacitySettings,
      setBannerMediaOpacity,
      setBannerOverlayOpacity,
      setSurfaceOpacity,
    ]
  );

  return (
    <UiOpacityContext.Provider value={value}>
      {children}
    </UiOpacityContext.Provider>
  );
}
