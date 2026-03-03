import {
  createContext,
  createElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getIllustrations,
  type CharacterIllustration,
} from '../assets/character';
import { normalizeKey } from '../assets/utils';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';

const RANDOM_BANNER_ALL_VALUE = '__random_all__';
const RANDOM_BANNER_PNG_VALUE = '__random_png__';
const RANDOM_BANNER_MP4_VALUE = '__random_mp4__';
const DEFAULT_BANNER_PREFERENCE = RANDOM_BANNER_ALL_VALUE;

export interface BannerOption {
  value: string;
  label: string;
  src: string;
  type: CharacterIllustration['type'];
}

const DEFAULT_BANNER_OPTION: BannerOption = {
  value: 'default',
  label: 'Default banner',
  src: '/banner.png',
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
});

export function BannerProvider({ children }: { children: ReactNode }) {
  const { data: characters } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  const [showOnAllRoutes, setShowOnAllRoutes] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY.HOME_BANNER_GLOBAL) === 'true';
  });

  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerOptionsReady, setBannerOptionsReady] = useState(false);
  const [bannerOptions, setBannerOptions] = useState<BannerOption[]>([
    DEFAULT_BANNER_OPTION,
  ]);
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

  const characterNameByAssetKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const character of characters) {
      const key = normalizeKey(character.name);
      if (!map.has(key)) map.set(key, character.name);
    }
    return map;
  }, [characters]);

  useEffect(() => {
    let isCancelled = false;

    async function loadBannerOptions(): Promise<void> {
      const entries = Array.from(characterNameByAssetKey.entries());
      if (entries.length === 0) return;

      try {
        const mediaByCharacter = await Promise.all(
          entries.map(async ([assetKey, characterName]) => {
            const illustrations = await getIllustrations(assetKey, assetKey);
            return { assetKey, characterName, illustrations };
          })
        );

        if (isCancelled) return;

        const loadedOptions: BannerOption[] = [DEFAULT_BANNER_OPTION];
        for (const {
          assetKey,
          characterName,
          illustrations,
        } of mediaByCharacter) {
          illustrations.forEach((illustration, index) => {
            loadedOptions.push({
              value: `${assetKey}::${index}`,
              label: `${characterName} — ${illustration.name}`,
              src: illustration.src,
              type: illustration.type,
            });
          });
        }

        const orderedOptions = [
          DEFAULT_BANNER_OPTION,
          ...loadedOptions
            .filter((option) => option.value !== DEFAULT_BANNER_OPTION.value)
            .sort((a, b) => a.label.localeCompare(b.label)),
        ];

        setBannerOptions(orderedOptions);
      } finally {
        if (!isCancelled) setBannerOptionsReady(true);
      }
    }

    loadBannerOptions().catch((error) => {
      console.error('Failed to load home banner options:', error);
    });

    return () => {
      isCancelled = true;
    };
  }, [characterNameByAssetKey]);

  useEffect(() => {
    if (!bannerOptionsReady) return;

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

  const selectedBanner =
    selectedBannerValue === null || !bannerOptionsReady
      ? null
      : (bannerOptions.find(
          (option) => option.value === selectedBannerValue
        ) ?? DEFAULT_BANNER_OPTION);

  const bannerSelectData = useMemo(
    () => [
      { value: RANDOM_BANNER_ALL_VALUE, label: 'Randomize (All)' },
      { value: RANDOM_BANNER_PNG_VALUE, label: 'Randomize (PNG only)' },
      { value: RANDOM_BANNER_MP4_VALUE, label: 'Randomize (MP4 only)' },
      ...bannerOptions.map((option) => ({
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
    }),
    [selectedBanner, bannerLoaded, bannerSelectData, bannerPreference, showOnAllRoutes]
  );

  return createElement(BannerContext.Provider, { value }, children);
}
