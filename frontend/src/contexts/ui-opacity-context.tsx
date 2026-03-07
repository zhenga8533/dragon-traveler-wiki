import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEY } from '../constants/ui';
import { UI_OPACITY_DEFAULTS, UiOpacityContext } from './ui-opacity';

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function parseStoredOpacity(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return clampOpacity(Number.isNaN(parsed) ? fallback : parsed);
}

export function UiOpacityProvider({ children }: { children: ReactNode }) {
  const [bannerMediaOpacity, setBannerMediaOpacityRaw] = useState<number>(
    () => {
      if (typeof window === 'undefined') {
        return UI_OPACITY_DEFAULTS.bannerMediaOpacity;
      }
      return parseStoredOpacity(
        window.localStorage.getItem(STORAGE_KEY.UI_BANNER_MEDIA_OPACITY),
        UI_OPACITY_DEFAULTS.bannerMediaOpacity
      );
    }
  );
  const [bannerOverlayOpacity, setBannerOverlayOpacityRaw] = useState<number>(
    () => {
      if (typeof window === 'undefined') {
        return UI_OPACITY_DEFAULTS.bannerOverlayOpacity;
      }
      return parseStoredOpacity(
        window.localStorage.getItem(STORAGE_KEY.UI_BANNER_OVERLAY_OPACITY),
        UI_OPACITY_DEFAULTS.bannerOverlayOpacity
      );
    }
  );
  const [surfaceOpacity, setSurfaceOpacityRaw] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return UI_OPACITY_DEFAULTS.surfaceOpacity;
    }
    return parseStoredOpacity(
      window.localStorage.getItem(STORAGE_KEY.UI_SURFACE_OPACITY),
      UI_OPACITY_DEFAULTS.surfaceOpacity
    );
  });

  const setBannerMediaOpacity = (value: number) => {
    setBannerMediaOpacityRaw(clampOpacity(value));
  };
  const setBannerOverlayOpacity = (value: number) => {
    setBannerOverlayOpacityRaw(clampOpacity(value));
  };
  const setSurfaceOpacity = (value: number) => {
    setSurfaceOpacityRaw(clampOpacity(value));
  };

  const resetOpacitySettings = () => {
    setBannerMediaOpacityRaw(UI_OPACITY_DEFAULTS.bannerMediaOpacity);
    setBannerOverlayOpacityRaw(UI_OPACITY_DEFAULTS.bannerOverlayOpacity);
    setSurfaceOpacityRaw(UI_OPACITY_DEFAULTS.surfaceOpacity);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY.UI_BANNER_MEDIA_OPACITY,
      String(bannerMediaOpacity)
    );
  }, [bannerMediaOpacity]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY.UI_BANNER_OVERLAY_OPACITY,
      String(bannerOverlayOpacity)
    );
  }, [bannerOverlayOpacity]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY.UI_SURFACE_OPACITY,
      String(surfaceOpacity)
    );
  }, [surfaceOpacity]);

  const value = useMemo(
    () => ({
      bannerMediaOpacity,
      setBannerMediaOpacity,
      bannerOverlayOpacity,
      setBannerOverlayOpacity,
      surfaceOpacity,
      setSurfaceOpacity,
      resetOpacitySettings,
    }),
    [bannerMediaOpacity, bannerOverlayOpacity, surfaceOpacity]
  );

  return (
    <UiOpacityContext.Provider value={value}>
      {children}
    </UiOpacityContext.Provider>
  );
}
