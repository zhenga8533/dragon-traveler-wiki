import {
  resolveIllustrations,
  type Illustration,
} from '@/assets';

import { DEFAULT_BANNER_SRC } from '@/constants/banner';
import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import {
  createContext,
  createElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const RANDOM_BANNER_ALL_VALUE = '__random_all__';
const RANDOM_BANNER_PNG_VALUE = '__random_png__';
const RANDOM_BANNER_MP4_VALUE = '__random_mp4__';
const NO_BANNER_VALUE = '__no_banner__';
const DEFAULT_BANNER_PREFERENCE = RANDOM_BANNER_ALL_VALUE;

export interface BannerOption {
  value: string;
  label: string;
  src: string;
  type: Illustration['type'];
}

const DEFAULT_BANNER_OPTION: BannerOption = {
  value: 'default',
  label: 'Default banner',
  src: DEFAULT_BANNER_SRC,
  type: 'image',
};

function pickRandomBanner(
  options: BannerOption[],
  mode: 'all' | 'png' | 'mp4'
): BannerOption | null {
  const candidates = options.filter((option) => {
    if (option.value === DEFAULT_BANNER_OPTION.value) return false;
    if (mode === 'png') return option.type === 'image';
    if (mode === 'mp4') return option.type === 'video';
    return true;
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export interface BannerContextValue {
  selectedBanner: { src: string; type: 'image' | 'video' } | null;
  bannerLoaded: boolean;
  setBannerLoaded: (loaded: boolean) => void;
  bannerSelectData: Array<{ value: string; label: string }>;
  bannerPreference: string;
  setBannerPreference: (value: string) => void;
  defaultBannerValue: string;
  showOnAllRoutes: boolean;
  setShowOnAllRoutes: (value: boolean) => void;
  slowScrollEnabled: boolean;
  setSlowScrollEnabled: (value: boolean) => void;
}

export const BannerContext = createContext<BannerContextValue>({
  selectedBanner: null,
  bannerLoaded: false,
  setBannerLoaded: () => {},
  bannerSelectData: [],
  bannerPreference: DEFAULT_BANNER_PREFERENCE,
  setBannerPreference: () => {},
  defaultBannerValue: DEFAULT_BANNER_OPTION.value,
  showOnAllRoutes: false,
  setShowOnAllRoutes: () => {},
  slowScrollEnabled: false,
  setSlowScrollEnabled: () => {},
});

export function BannerProvider({ children }: { children: ReactNode }) {
  const { data: characters } = useCharacters();

  const [showOnAllRoutes, setShowOnAllRoutes] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.localStorage.getItem(STORAGE_KEY.HOME_BANNER_GLOBAL) === 'true'
    );
  });
  const [slowScrollEnabled, setSlowScrollEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.localStorage.getItem(STORAGE_KEY.HOME_BANNER_SLOW_SCROLL) ===
      'true'
    );
  });

  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerPreference, setBannerPreference] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_BANNER_PREFERENCE;
    return (
      window.localStorage.getItem(STORAGE_KEY.HOME_BANNER) ??
      DEFAULT_BANNER_PREFERENCE
    );
  });
  const [selectedBannerValue, setSelectedBannerValue] = useState<string | null>(
    null
  );

  const bannerSourcesByAssetKey = useMemo(() => {
    const map = new Map<
      string,
      { characterName: string; illustrations: Illustration[] }
    >();
    for (const character of characters) {
      const assetKey = character.slug;
      if (map.has(assetKey)) continue;
      map.set(assetKey, {
        characterName: character.name,
        illustrations: resolveIllustrations(
          assetKey,
          assetKey,
          character.illustrations
        ),
      });
    }
    return map;
  }, [characters]);

  const bannerOptions = useMemo(() => {
    const loadedOptions: BannerOption[] = [DEFAULT_BANNER_OPTION];
    for (const [assetKey, { characterName, illustrations }] of bannerSourcesByAssetKey) {
      illustrations.forEach((illustration, index) => {
        loadedOptions.push({
          value: `${assetKey}::${index}`,
          label: `${characterName} — ${illustration.name}`,
          src: illustration.src,
          type: illustration.type,
        });
      });
    }

    return [
      DEFAULT_BANNER_OPTION,
      ...loadedOptions
        .filter((option) => option.value !== DEFAULT_BANNER_OPTION.value)
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [bannerSourcesByAssetKey]);

  const bannerOptionsReady = characters.length > 0;

  useEffect(() => {
    if (!bannerOptionsReady) return;

    if (bannerPreference === NO_BANNER_VALUE) {
      setSelectedBannerValue(null);
      return;
    }

    if (bannerPreference === RANDOM_BANNER_ALL_VALUE) {
      const random = pickRandomBanner(bannerOptions, 'all');
      setSelectedBannerValue(random?.value ?? DEFAULT_BANNER_OPTION.value);
      return;
    }
    if (bannerPreference === RANDOM_BANNER_PNG_VALUE) {
      const random = pickRandomBanner(bannerOptions, 'png');
      setSelectedBannerValue(random?.value ?? DEFAULT_BANNER_OPTION.value);
      return;
    }
    if (bannerPreference === RANDOM_BANNER_MP4_VALUE) {
      const random = pickRandomBanner(bannerOptions, 'mp4');
      setSelectedBannerValue(random?.value ?? DEFAULT_BANNER_OPTION.value);
      return;
    }

    const exists = bannerOptions.some(
      (option) => option.value === bannerPreference
    );
    if (exists) {
      setSelectedBannerValue(bannerPreference);
      return;
    }

    const random = pickRandomBanner(bannerOptions, 'all');
    setSelectedBannerValue(random?.value ?? DEFAULT_BANNER_OPTION.value);
    setBannerPreference(DEFAULT_BANNER_PREFERENCE);
  }, [bannerOptions, bannerOptionsReady, bannerPreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.HOME_BANNER, bannerPreference);
  }, [bannerPreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY.HOME_BANNER_GLOBAL,
      String(showOnAllRoutes)
    );
  }, [showOnAllRoutes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY.HOME_BANNER_SLOW_SCROLL,
      String(slowScrollEnabled)
    );
  }, [slowScrollEnabled]);

  const selectedBanner =
    selectedBannerValue === null || !bannerOptionsReady
      ? null
      : (bannerOptions.find((option) => option.value === selectedBannerValue) ??
        DEFAULT_BANNER_OPTION);

  const bannerSelectData = useMemo(
    () => [
      {
        value: DEFAULT_BANNER_OPTION.value,
        label: DEFAULT_BANNER_OPTION.label,
      },
      { value: NO_BANNER_VALUE, label: 'No banner' },
      { value: RANDOM_BANNER_ALL_VALUE, label: 'Randomize (All)' },
      { value: RANDOM_BANNER_PNG_VALUE, label: 'Randomize (PNG only)' },
      { value: RANDOM_BANNER_MP4_VALUE, label: 'Randomize (MP4 only)' },
      ...bannerOptions
        .filter((option) => option.value !== DEFAULT_BANNER_OPTION.value)
        .map((option) => ({
          value: option.value,
          label: option.label,
        })),
    ],
    [bannerOptions]
  );

  useEffect(() => {
    setBannerLoaded(false);
  }, [selectedBanner?.src]);

  const value = useMemo(
    () => ({
      selectedBanner,
      bannerLoaded,
      setBannerLoaded,
      bannerSelectData,
      bannerPreference,
      setBannerPreference,
      defaultBannerValue: DEFAULT_BANNER_OPTION.value,
      showOnAllRoutes,
      setShowOnAllRoutes,
      slowScrollEnabled,
      setSlowScrollEnabled,
    }),
    [
      selectedBanner,
      bannerLoaded,
      bannerSelectData,
      bannerPreference,
      showOnAllRoutes,
      slowScrollEnabled,
    ]
  );

  return createElement(BannerContext.Provider, { value }, children);
}
