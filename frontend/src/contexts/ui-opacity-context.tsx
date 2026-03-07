import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEY } from '../constants/ui';

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function parseStoredOpacity(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return clampOpacity(Number.isNaN(parsed) ? fallback : parsed);
}

const DEFAULT_BANNER_MEDIA_OPACITY = 1;
const DEFAULT_BANNER_OVERLAY_OPACITY = 0.8;
const DEFAULT_SURFACE_OPACITY = 0.9;

export interface UiOpacityContextValue {
  bannerMediaOpacity: number;
  setBannerMediaOpacity: (value: number) => void;
  bannerOverlayOpacity: number;
  setBannerOverlayOpacity: (value: number) => void;
  surfaceOpacity: number;
  setSurfaceOpacity: (value: number) => void;
  resetOpacitySettings: () => void;
}

export const UiOpacityContext = createContext<UiOpacityContextValue>({
  bannerMediaOpacity: DEFAULT_BANNER_MEDIA_OPACITY,
  setBannerMediaOpacity: () => {},
  bannerOverlayOpacity: DEFAULT_BANNER_OVERLAY_OPACITY,
  setBannerOverlayOpacity: () => {},
  surfaceOpacity: DEFAULT_SURFACE_OPACITY,
  setSurfaceOpacity: () => {},
  resetOpacitySettings: () => {},
});

export function UiOpacityProvider({ children }: { children: ReactNode }) {
  const [bannerMediaOpacity, setBannerMediaOpacityRaw] = useState<number>(
    () => {
      if (typeof window === 'undefined') return DEFAULT_BANNER_MEDIA_OPACITY;
      return parseStoredOpacity(
        window.localStorage.getItem(STORAGE_KEY.UI_BANNER_MEDIA_OPACITY),
        DEFAULT_BANNER_MEDIA_OPACITY
      );
    }
  );
  const [bannerOverlayOpacity, setBannerOverlayOpacityRaw] = useState<number>(
    () => {
      if (typeof window === 'undefined') return DEFAULT_BANNER_OVERLAY_OPACITY;
      return parseStoredOpacity(
        window.localStorage.getItem(STORAGE_KEY.UI_BANNER_OVERLAY_OPACITY),
        DEFAULT_BANNER_OVERLAY_OPACITY
      );
    }
  );
  const [surfaceOpacity, setSurfaceOpacityRaw] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_SURFACE_OPACITY;
    return parseStoredOpacity(
      window.localStorage.getItem(STORAGE_KEY.UI_SURFACE_OPACITY),
      DEFAULT_SURFACE_OPACITY
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
    setBannerMediaOpacityRaw(DEFAULT_BANNER_MEDIA_OPACITY);
    setBannerOverlayOpacityRaw(DEFAULT_BANNER_OVERLAY_OPACITY);
    setSurfaceOpacityRaw(DEFAULT_SURFACE_OPACITY);
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
