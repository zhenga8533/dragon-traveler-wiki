import {
  resolveIllustrations,
  probeIllustrations,
  resolveManifestIllustrations,
  type Illustration,
} from '@/assets';

import { DEFAULT_BANNER_SRC } from '@/constants/banner';
import { STORAGE_KEY } from '@/constants/ui';
import { FavoriteIllustrationsContext } from './favorite-illustrations';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useAssetManifest } from '@/hooks/use-asset-manifest';
import {
  createContext,
  createElement,
  useContext,
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
  videoVariant?: Illustration['videoVariant'];
}

const DEFAULT_BANNER_OPTION: BannerOption = {
  value: 'default',
  label: 'Default banner',
  src: DEFAULT_BANNER_SRC,
  type: 'image',
};

function isKnownBannerPreference(
  preference: string,
  options: BannerOption[],
): boolean {
  return (
    preference === NO_BANNER_VALUE ||
    preference === RANDOM_BANNER_ALL_VALUE ||
    preference === RANDOM_BANNER_PNG_VALUE ||
    preference === RANDOM_BANNER_MP4_VALUE ||
    options.some((option) => option.value === preference)
  );
}

function pickRandomBanner(
  options: BannerOption[],
  mode: 'all' | 'png' | 'mp4',
  favorites?: Set<string>,
): BannerOption | null {
  const matchesMode = (option: BannerOption) => {
    if (option.value === DEFAULT_BANNER_OPTION.value) return false;
    if (mode === 'png') return option.type === 'image';
    if (mode === 'mp4') return option.type === 'video';
    return true;
  };

  // Restrict to favorites when requested, but fall back to the full candidate
  // pool if no favorites match so the banner never silently stops rotating.
  // Favorited birth clips are allowed here even though the general pool below excludes them.
  if (favorites && favorites.size > 0) {
    const favoriteCandidates = options.filter(
      (option) => matchesMode(option) && favorites.has(option.value),
    );
    if (favoriteCandidates.length > 0) {
      return favoriteCandidates[
        Math.floor(Math.random() * favoriteCandidates.length)
      ];
    }
  }

  // Birth clips are one-time entrance animations, not meant for repeated random
  // rotation, so the unfavorited pool only draws from loop clips (and images).
  const candidates = options.filter(
    (option) => matchesMode(option) && option.videoVariant !== 'birth',
  );
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
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
  /** Which random mode is active, or null if a specific/no/default banner is selected. */
  randomBannerMode: 'all' | 'png' | 'mp4' | null;
  /** Count of favorited illustrations matching randomBannerMode's media type. */
  favoritesMatchingCurrentMode: number;
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
  favoritesOnly: false,
  setFavoritesOnly: () => {},
  randomBannerMode: null,
  favoritesMatchingCurrentMode: 0,
});

export function BannerProvider({ children }: { children: ReactNode }) {
  const { data: characters } = useCharacters();
  const assetManifest = useAssetManifest();
  const { favoriteIllustrations } = useContext(FavoriteIllustrationsContext);

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
  const [favoritesOnly, setFavoritesOnly] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.localStorage.getItem(STORAGE_KEY.HOME_BANNER_FAVORITES_ONLY) ===
      'true'
    );
  });

  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [prevBannerSrc, setPrevBannerSrc] = useState<string | undefined>(
    undefined,
  );
  const [bannerPreference, setBannerPreference] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_BANNER_PREFERENCE;
    return (
      window.localStorage.getItem(STORAGE_KEY.HOME_BANNER) ??
      DEFAULT_BANNER_PREFERENCE
    );
  });
  const bannerSourceCandidates = useMemo(() => {
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
          character.skins,
        ),
      });
    }
    return map;
  }, [characters]);
  const [probedBannerSources, setProbedBannerSources] = useState(
    bannerSourceCandidates,
  );
  useEffect(() => {
    if (!assetManifest.error) return;
    let cancelled = false;
    Promise.all(
      [...bannerSourceCandidates].map(
        async ([key, entry]) =>
          [
            key,
            {
              ...entry,
              illustrations: await probeIllustrations(entry.illustrations),
            },
          ] as const,
      ),
    ).then((entries) => {
      if (!cancelled) setProbedBannerSources(new Map(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [assetManifest.error, bannerSourceCandidates]);
  const bannerSourcesByAssetKey = useMemo<
    Map<string, { characterName: string; illustrations: Illustration[] }>
  >(() => {
    if (assetManifest.loading) return new Map();
    if (assetManifest.error) return probedBannerSources;
    return new Map(
      [...bannerSourceCandidates].map(([key, entry]) => [
        key,
        {
          ...entry,
          illustrations: resolveManifestIllustrations(
            entry.illustrations,
            assetManifest.data.assets,
          ),
        },
      ]),
    );
  }, [
    assetManifest.data.assets,
    assetManifest.error,
    assetManifest.loading,
    bannerSourceCandidates,
    probedBannerSources,
  ]);

  const bannerOptions = useMemo(() => {
    const loadedOptions: BannerOption[] = [DEFAULT_BANNER_OPTION];
    for (const [
      assetKey,
      { characterName, illustrations },
    ] of bannerSourcesByAssetKey) {
      illustrations.forEach((illustration, index) => {
        loadedOptions.push({
          value: `${assetKey}::${index}`,
          label: `${characterName} — ${illustration.name}`,
          src: illustration.src,
          type: illustration.type,
          videoVariant: illustration.videoVariant,
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

  const bannerOptionsReady = characters.length > 0 && !assetManifest.loading;
  const effectiveBannerPreference =
    bannerOptionsReady &&
    !isKnownBannerPreference(bannerPreference, bannerOptions)
      ? DEFAULT_BANNER_PREFERENCE
      : bannerPreference;

  const selectedBannerValue = useMemo(() => {
    if (!bannerOptionsReady) return null;
    if (effectiveBannerPreference === NO_BANNER_VALUE) return null;

    const favoritesFilter = favoritesOnly ? favoriteIllustrations : undefined;

    if (effectiveBannerPreference === RANDOM_BANNER_ALL_VALUE) {
      return (
        pickRandomBanner(bannerOptions, 'all', favoritesFilter)?.value ??
        DEFAULT_BANNER_OPTION.value
      );
    }
    if (effectiveBannerPreference === RANDOM_BANNER_PNG_VALUE) {
      return (
        pickRandomBanner(bannerOptions, 'png', favoritesFilter)?.value ??
        DEFAULT_BANNER_OPTION.value
      );
    }
    if (effectiveBannerPreference === RANDOM_BANNER_MP4_VALUE) {
      return (
        pickRandomBanner(bannerOptions, 'mp4', favoritesFilter)?.value ??
        DEFAULT_BANNER_OPTION.value
      );
    }

    const exists = bannerOptions.some(
      (option) => option.value === effectiveBannerPreference,
    );
    if (exists) return effectiveBannerPreference;

    return (
      pickRandomBanner(bannerOptions, 'all', favoritesFilter)?.value ??
      DEFAULT_BANNER_OPTION.value
    );
  }, [
    bannerOptions,
    bannerOptionsReady,
    effectiveBannerPreference,
    favoritesOnly,
    favoriteIllustrations,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !bannerOptionsReady) return;
    window.localStorage.setItem(
      STORAGE_KEY.HOME_BANNER,
      effectiveBannerPreference,
    );
  }, [bannerOptionsReady, effectiveBannerPreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY.HOME_BANNER_GLOBAL,
      String(showOnAllRoutes),
    );
  }, [showOnAllRoutes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY.HOME_BANNER_SLOW_SCROLL,
      String(slowScrollEnabled),
    );
  }, [slowScrollEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY.HOME_BANNER_FAVORITES_ONLY,
      String(favoritesOnly),
    );
  }, [favoritesOnly]);

  const selectedBanner =
    selectedBannerValue === null || !bannerOptionsReady
      ? null
      : (bannerOptions.find((option) => option.value === selectedBannerValue) ??
        DEFAULT_BANNER_OPTION);

  if (selectedBanner?.src !== prevBannerSrc) {
    setPrevBannerSrc(selectedBanner?.src);
    setBannerLoaded(false);
  }

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
    [bannerOptions],
  );

  const randomBannerMode: 'all' | 'png' | 'mp4' | null =
    effectiveBannerPreference === RANDOM_BANNER_ALL_VALUE
      ? 'all'
      : effectiveBannerPreference === RANDOM_BANNER_PNG_VALUE
        ? 'png'
        : effectiveBannerPreference === RANDOM_BANNER_MP4_VALUE
          ? 'mp4'
          : null;

  const favoritesMatchingCurrentMode = useMemo(() => {
    if (!randomBannerMode) return 0;
    return bannerOptions.filter((option) => {
      if (!favoriteIllustrations.has(option.value)) return false;
      if (randomBannerMode === 'png') return option.type === 'image';
      if (randomBannerMode === 'mp4') return option.type === 'video';
      return true;
    }).length;
  }, [bannerOptions, favoriteIllustrations, randomBannerMode]);

  const value = useMemo(
    () => ({
      selectedBanner,
      bannerLoaded,
      setBannerLoaded,
      bannerSelectData,
      bannerPreference: effectiveBannerPreference,
      setBannerPreference,
      defaultBannerValue: DEFAULT_BANNER_OPTION.value,
      showOnAllRoutes,
      setShowOnAllRoutes,
      slowScrollEnabled,
      setSlowScrollEnabled,
      favoritesOnly,
      setFavoritesOnly,
      randomBannerMode,
      favoritesMatchingCurrentMode,
    }),
    [
      selectedBanner,
      bannerLoaded,
      bannerSelectData,
      effectiveBannerPreference,
      showOnAllRoutes,
      slowScrollEnabled,
      favoritesOnly,
      randomBannerMode,
      favoritesMatchingCurrentMode,
    ],
  );

  return createElement(BannerContext.Provider, { value }, children);
}
