import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Kbd,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import {
  IoGameController,
  IoGlobe,
  IoList,
  IoOpenOutline,
  IoPeople,
  IoPricetag,
  IoSearch,
  IoTrophy,
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import {
  getIllustrations,
  type CharacterIllustration,
} from '../../assets/character';
import { normalizeKey } from '../../assets/utils';
import SearchModal from '../../components/tools/SearchModal';
import {
  HOME_HERO_META_TEXT_STYLE,
  HOME_HERO_PLAY_NOW_STYLE,
  HOME_HERO_SUBTITLE_STYLE,
  HOME_HERO_TITLE_STYLE,
  HOME_HERO_WORDMARK_STYLE,
  getCardHoverProps,
  getHomeHeroPlaceholderGradient,
} from '../../constants/styles';
import { TRANSITION } from '../../constants/ui';
import { useDataFetch } from '../../hooks/use-data-fetch';
import type { Character } from '../../types/character';
import ActiveCodesSection from './ActiveCodesSection';
import DataStatsBar from './DataStatsBar';
import FeaturedCharactersMarquee from './FeaturedCharactersMarquee';
import RecentUpdatesSection from './RecentUpdatesSection';

const GENRES = ['Strategy', 'RPG', 'Card Game', 'Idle', 'Comedy', 'Anime'];

const LANGUAGES = [
  'English',
  'Japanese',
  'Korean',
  'Simplified Chinese',
  'Traditional Chinese',
  'Thai',
  'Vietnamese',
];

const HOME_CTA_BUTTON_STYLES = {
  root: {
    transition: `transform 180ms ${TRANSITION.EASE}, box-shadow 220ms ${TRANSITION.EASE}, filter 180ms ${TRANSITION.EASE}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 26px rgba(0, 0, 0, 0.26)',
      filter: 'saturate(1.04)',
    },
  },
};

const HOME_BANNER_STORAGE_KEY = 'home-banner-selection';

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

export default function Home() {
  const isDark = useComputedColorScheme('light') === 'dark';

  const { data: characters } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerOptions, setBannerOptions] = useState<HomeBannerOption[]>([
    DEFAULT_BANNER_OPTION,
  ]);
  const [selectedBannerValue, setSelectedBannerValue] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_BANNER_OPTION.value;
    }
    return (
      window.localStorage.getItem(HOME_BANNER_STORAGE_KEY) ??
      DEFAULT_BANNER_OPTION.value
    );
  });

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
      const entries = Array.from(characterNameByAssetKey.entries());
      if (entries.length === 0) {
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
      setSelectedBannerValue((currentValue) => {
        const exists = orderedOptions.some(
          (option) => option.value === currentValue
        );
        return exists ? currentValue : DEFAULT_BANNER_OPTION.value;
      });
    }

    loadBannerOptions().catch((error) => {
      console.error('Failed to load home banner options:', error);
    });

    return () => {
      isCancelled = true;
    };
  }, [characterNameByAssetKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(HOME_BANNER_STORAGE_KEY, selectedBannerValue);
  }, [selectedBannerValue]);

  const selectedBanner =
    bannerOptions.find((option) => option.value === selectedBannerValue) ??
    DEFAULT_BANNER_OPTION;

  useEffect(() => {
    setBannerLoaded(false);
  }, [selectedBanner.src]);

  return (
    <Stack gap={0}>
      {/* Hero banner with overlapping content */}
      <Box
        style={{
          position: 'relative',
          minHeight: 350,
          marginLeft: 'calc(var(--mantine-spacing-md) * -1)',
          marginRight: 'calc(var(--mantine-spacing-md) * -1)',
          marginTop: 'calc(var(--mantine-spacing-md) * -1)',
          overflow: 'hidden',
        }}
      >
        {/* Banner image container */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Gradient placeholder (visible while banner loads) */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: getHomeHeroPlaceholderGradient(isDark),
            }}
          />
          {/* Selected banner media (fades in when loaded) */}
          {selectedBanner.type === 'video' ? (
            <video
              src={selectedBanner.src}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setBannerLoaded(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                opacity: bannerLoaded ? 1 : 0,
                transition: `opacity ${TRANSITION.SLOW} ${TRANSITION.EASE}`,
              }}
            />
          ) : (
            <img
              src={selectedBanner.src}
              alt=""
              fetchPriority="high"
              onLoad={() => setBannerLoaded(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                opacity: bannerLoaded ? 1 : 0,
                transition: `opacity ${TRANSITION.SLOW} ${TRANSITION.EASE}`,
              }}
            />
          )}
          {/* Dark overlay for text readability */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? 'rgba(0, 0, 0, 0.45)'
                : 'rgba(0, 0, 0, 0.35)',
            }}
          />
          {/* Bottom gradient fade to page background */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, transparent 40%, var(--mantine-color-body) 100%)',
            }}
          />
          {/* Side gradient fades */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to right, var(--mantine-color-body) 0%, transparent 10%, transparent 90%, var(--mantine-color-body) 100%)',
            }}
          />
        </Box>

        {/* Content that overlaps the banner */}
        <Container
          size="md"
          style={{ position: 'relative', zIndex: 1 }}
          pt={60}
          pb="xl"
        >
          <Stack gap="lg">
            {/* Title */}
            <Box style={{ textAlign: 'center' }}>
              <Title order={1} style={HOME_HERO_TITLE_STYLE}>
                <Text component="span" inherit style={HOME_HERO_WORDMARK_STYLE}>
                  Dragon Traveler
                </Text>{' '}
                <Text
                  component="span"
                  inherit
                  style={{ color: 'var(--mantine-color-white)' }}
                >
                  Wiki
                </Text>
              </Title>
              <Text size="lg" mt="xs" style={HOME_HERO_SUBTITLE_STYLE}>
                A{' '}
                <Text
                  component="span"
                  inherit
                  fw={700}
                  style={{ color: 'var(--mantine-color-violet-1)' }}
                >
                  community-driven
                </Text>{' '}
                wiki for{' '}
                <Text
                  component="span"
                  inherit
                  fw={700}
                  style={{ color: 'var(--mantine-color-blue-1)' }}
                >
                  Dragon Traveler
                </Text>
              </Text>
              <Text size="sm" mt={6} style={HOME_HERO_META_TEXT_STYLE}>
                Authored by{' '}
                <Text component="span" inherit fw={700} c="grape.2">
                  Litee
                </Text>{' '}
                <Text component="span" inherit c="blue.1">
                  (Server: Freya 2)
                </Text>
              </Text>
              <Select
                mt="md"
                size="sm"
                radius="md"
                label="Landing banner"
                placeholder="Select a character illustration"
                data={bannerOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={selectedBannerValue}
                searchable
                nothingFoundMessage="No illustrations found"
                onChange={(value) => {
                  setBannerLoaded(false);
                  setSelectedBannerValue(value ?? DEFAULT_BANNER_OPTION.value);
                }}
                style={{ maxWidth: 420, marginInline: 'auto' }}
              />
              <Stack gap="sm" mt="md" align="center">
                <Group gap="sm" justify="center" wrap="wrap">
                  <Button
                    component={Link}
                    to="/characters"
                    size="md"
                    radius="md"
                    styles={HOME_CTA_BUTTON_STYLES}
                    leftSection={<IoPeople size={18} />}
                  >
                    Browse Characters
                  </Button>
                  <Button
                    component={Link}
                    to="/tier-list"
                    size="md"
                    radius="md"
                    variant="light"
                    color="grape"
                    styles={HOME_CTA_BUTTON_STYLES}
                    leftSection={<IoTrophy size={18} />}
                  >
                    View Tier List
                  </Button>
                  <Button
                    component="a"
                    href="https://dt.game-tree.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    visibleFrom="sm"
                    size="sm"
                    radius="md"
                    variant="outline"
                    color="gray"
                    styles={HOME_CTA_BUTTON_STYLES}
                    leftSection={<IoGameController size={18} />}
                    rightSection={<IoOpenOutline size={14} />}
                    style={HOME_HERO_PLAY_NOW_STYLE}
                  >
                    Play Now
                  </Button>
                </Group>
                <Group gap="xs" justify="center">
                  <SearchModal
                    enableHotkeys={false}
                    trigger={({ open }) => (
                      <Button
                        onClick={open}
                        size="sm"
                        radius="md"
                        variant="white"
                        color="dark"
                        styles={HOME_CTA_BUTTON_STYLES}
                        leftSection={<IoSearch size={16} />}
                      >
                        Search the Wiki
                      </Button>
                    )}
                  />
                  <Group gap={4} visibleFrom="sm">
                    <Text size="xs" style={HOME_HERO_META_TEXT_STYLE}>
                      press
                    </Text>
                    <Kbd size="xs">/</Kbd>
                  </Group>
                </Group>
              </Stack>
            </Box>

            {/* Game info card - overlaps the banner */}
            <Card
              padding="lg"
              radius="md"
              withBorder
              shadow="lg"
              {...getCardHoverProps({
                style: {
                  backdropFilter: 'blur(8px)',
                  backgroundColor: isDark
                    ? 'rgba(20, 21, 23, 0.92)'
                    : 'rgba(255, 255, 255, 0.9)',
                },
              })}
            >
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon
                    variant="light"
                    color="grape"
                    size="lg"
                    radius="md"
                  >
                    <IoGameController size={20} />
                  </ThemeIcon>
                  <Title order={2} size="h3">
                    About the Game
                  </Title>
                </Group>
                <Text size="sm" fs="italic" c="dimmed">
                  Love x Comedy x Isekai = The Ultimate Bishoujo RPG!
                </Text>
                <Text size="sm">
                  Dragon Traveler is a free-to-play idle RPG developed and
                  published by GameTree. Play as Fafnir, heir of the legendary
                  dragon, in a rom-com isekai adventure featuring card-based
                  combat, strategic Dragon Soul mechanics, and a colorful cast
                  of characters.
                </Text>
                <Group gap="xs" wrap="wrap">
                  {GENRES.map((genre) => (
                    <Badge key={genre} variant="light" size="sm">
                      {genre}
                    </Badge>
                  ))}
                  <Badge variant="light" color="green" size="sm">
                    Free to Play
                  </Badge>
                </Group>
                <Group gap="sm" wrap="nowrap" style={{ overflow: 'hidden' }}>
                  <ThemeIcon
                    variant="light"
                    color="blue"
                    size="md"
                    radius="md"
                    style={{ flexShrink: 0 }}
                  >
                    <IoGlobe size={16} />
                  </ThemeIcon>
                  <Text
                    size="sm"
                    c="dimmed"
                    style={{ wordBreak: 'break-word' }}
                  >
                    {LANGUAGES.join(' \u00b7 ')}
                  </Text>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Box>

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
