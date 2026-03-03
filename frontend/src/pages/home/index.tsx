import {
  Box,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  ThemeIcon,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IoList, IoPricetag } from 'react-icons/io5';
import {
  getIllustrations,
  type CharacterIllustration,
} from '../../assets/character';
import { normalizeKey } from '../../assets/utils';
import { getCardHoverProps } from '../../constants/styles';
import { useDataFetch } from '../../hooks/use-data-fetch';
import type { Character } from '../../types/character';
import ActiveCodesSection from './ActiveCodesSection';
import DataStatsBar from './DataStatsBar';
import FeaturedCharactersMarquee from './FeaturedCharactersMarquee';
import HomeHeroSection from './HomeHeroSection';
import RecentUpdatesSection from './RecentUpdatesSection';

const HOME_BANNER_STORAGE_KEY = 'home-banner-selection';
const RANDOM_BANNER_ALL_VALUE = '__random_all__';
const RANDOM_BANNER_PNG_VALUE = '__random_png__';
const RANDOM_BANNER_MP4_VALUE = '__random_mp4__';
const DEFAULT_BANNER_PREFERENCE = RANDOM_BANNER_ALL_VALUE;

interface HomeBannerOption {
  value: string;
  label: string;
  src: string;
  type: CharacterIllustration['type'];
}

const DEFAULT_BANNER_OPTION: HomeBannerOption = {
  value: 'default',
  label: 'Default banner',
  src: '/banner.png',
  type: 'image',
};

function pickRandomBanner(
  options: HomeBannerOption[],
  mode: 'all' | 'png' | 'mp4'
): HomeBannerOption | null {
  const candidates = options.filter((option) => {
    if (option.value === DEFAULT_BANNER_OPTION.value) {
      return false;
    }

    if (mode === 'png') {
      return option.type === 'image';
    }

    if (mode === 'mp4') {
      return option.type === 'video';
    }

    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

export default function Home() {
  const isDark = useComputedColorScheme('light') === 'dark';

  const { data: characters } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerOptionsReady, setBannerOptionsReady] = useState(false);
  const [bannerOptions, setBannerOptions] = useState<HomeBannerOption[]>([
    DEFAULT_BANNER_OPTION,
  ]);
  const [bannerPreference, setBannerPreference] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_BANNER_PREFERENCE;
    }
    return (
      window.localStorage.getItem(HOME_BANNER_STORAGE_KEY) ??
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
      if (!map.has(key)) {
        map.set(key, character.name);
      }
    }
    return map;
  }, [characters]);

  useEffect(() => {
    let isCancelled = false;

    async function loadBannerOptions(): Promise<void> {
      try {
        const entries = Array.from(characterNameByAssetKey.entries());
        if (entries.length === 0) {
          setBannerOptions([DEFAULT_BANNER_OPTION]);
          return;
        }

        const mediaByCharacter = await Promise.all(
          entries.map(async ([assetKey, characterName]) => {
            const illustrations = await getIllustrations(assetKey, assetKey);
            return { assetKey, characterName, illustrations };
          })
        );

        if (isCancelled) {
          return;
        }

        const loadedOptions: HomeBannerOption[] = [DEFAULT_BANNER_OPTION];
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
        if (!isCancelled) {
          setBannerOptionsReady(true);
        }
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
    if (!bannerOptionsReady) {
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
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(HOME_BANNER_STORAGE_KEY, bannerPreference);
  }, [bannerPreference]);

  const selectedBanner =
    selectedBannerValue === null
      ? null
      : (bannerOptions.find((option) => option.value === selectedBannerValue) ??
        DEFAULT_BANNER_OPTION);

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

  return (
    <Stack gap={0}>
      <HomeHeroSection
        isDark={isDark}
        bannerLoaded={bannerLoaded}
        selectedBanner={selectedBanner}
        bannerSelectData={bannerSelectData}
        bannerPreference={bannerPreference}
        defaultBannerValue={DEFAULT_BANNER_OPTION.value}
        onBannerLoaded={() => setBannerLoaded(true)}
        onBannerPreferenceChange={setBannerPreference}
      />

      {/* Content sections */}
      <Container size="lg" py="xl" mt="md">
        <Stack gap="xl">
          {/* Featured Characters Marquee */}
          <FeaturedCharactersMarquee />

          {/* Data stats bar */}
          <DataStatsBar />

          {/* Active Codes & Recent Updates row */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Box>
              <Card
                padding="lg"
                radius="md"
                withBorder
                h="100%"
                {...getCardHoverProps()}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <ThemeIcon
                      variant="light"
                      color="grape"
                      size="lg"
                      radius="md"
                    >
                      <IoPricetag size={20} />
                    </ThemeIcon>
                    <Title order={2} size="h3">
                      Active Codes
                    </Title>
                  </Group>
                  <ActiveCodesSection />
                </Stack>
              </Card>
            </Box>

            <Box>
              <Card
                padding="lg"
                radius="md"
                withBorder
                h="100%"
                {...getCardHoverProps()}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <ThemeIcon
                      variant="light"
                      color="grape"
                      size="lg"
                      radius="md"
                    >
                      <IoList size={20} />
                    </ThemeIcon>
                    <Title order={2} size="h3">
                      Recent Updates
                    </Title>
                  </Group>
                  <RecentUpdatesSection />
                </Stack>
              </Card>
            </Box>
          </SimpleGrid>
        </Stack>
      </Container>
    </Stack>
  );
}
