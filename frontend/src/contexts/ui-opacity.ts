import { createContext } from 'react';

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

export const UI_OPACITY_DEFAULTS = {
  bannerMediaOpacity: DEFAULT_BANNER_MEDIA_OPACITY,
  bannerOverlayOpacity: DEFAULT_BANNER_OVERLAY_OPACITY,
  surfaceOpacity: DEFAULT_SURFACE_OPACITY,
} as const;
