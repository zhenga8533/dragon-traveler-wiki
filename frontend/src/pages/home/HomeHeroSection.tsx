import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Kbd,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IoGameController,
  IoGlobe,
  IoOpenOutline,
  IoPeople,
  IoSearch,
  IoTrophy,
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
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

export interface HomeHeroBannerMedia {
  src: string;
  type: 'image' | 'video';
}

interface HomeHeroSectionProps {
  isDark: boolean;
  bannerLoaded: boolean;
  selectedBanner: HomeHeroBannerMedia | null;
  bannerSelectData: Array<{ value: string; label: string }>;
  bannerPreference: string;
  defaultBannerValue: string;
  onBannerLoaded: () => void;
  onBannerPreferenceChange: (value: string) => void;
}

export default function HomeHeroSection({
  isDark,
  bannerLoaded,
  selectedBanner,
  bannerSelectData,
  bannerPreference,
  defaultBannerValue,
  onBannerLoaded,
  onBannerPreferenceChange,
}: HomeHeroSectionProps) {
  return (
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
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: getHomeHeroPlaceholderGradient(isDark),
          }}
        />
        {selectedBanner?.type === 'video' ? (
          <video
            src={selectedBanner.src}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={onBannerLoaded}
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
        ) : selectedBanner ? (
          <img
            src={selectedBanner.src}
            alt=""
            fetchPriority="high"
            onLoad={onBannerLoaded}
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
        ) : null}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.35)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, transparent 40%, var(--mantine-color-body) 100%)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to right, var(--mantine-color-body) 0%, transparent 10%, transparent 90%, var(--mantine-color-body) 100%)',
          }}
        />
      </Box>

      <Container
        size="md"
        style={{ position: 'relative', zIndex: 1 }}
        pt={60}
        pb="xl"
      >
        <Stack gap="lg">
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
            <Box
              mt="md"
              mx="auto"
              style={{
                width: '100%',
                maxWidth: 500,
                padding: '12px 14px',
                borderRadius: '12px',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.14)'
                  : '1px solid rgba(255, 255, 255, 0.26)',
                background: isDark
                  ? 'rgba(16, 18, 22, 0.58)'
                  : 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(6px)',
                boxShadow: isDark
                  ? '0 8px 20px rgba(0, 0, 0, 0.28)'
                  : '0 8px 20px rgba(19, 26, 44, 0.18)',
              }}
            >
              <Group justify="space-between" align="center" mb={6}>
                <Text
                  size="xs"
                  fw={700}
                  tt="uppercase"
                  c={isDark ? 'violet.1' : 'indigo.8'}
                  style={{ letterSpacing: 0.7 }}
                >
                  Landing Banner
                </Text>
                <Badge
                  size="sm"
                  variant="light"
                  color={selectedBanner?.type === 'video' ? 'pink' : 'blue'}
                >
                  {selectedBanner?.type === 'video' ? 'MP4' : 'PNG'}
                </Badge>
              </Group>
              <Text size="xs" c={isDark ? 'gray.3' : 'dark.1'} mb={8}>
                Choose an illustration, or randomize from all media, PNGs, or
                MP4 clips.
              </Text>
              <Select
                size="sm"
                radius="md"
                placeholder="Select a character illustration"
                data={bannerSelectData}
                value={bannerPreference}
                searchable
                nothingFoundMessage="No illustrations found"
                onChange={(value) => {
                  onBannerPreferenceChange(value ?? defaultBannerValue);
                }}
                styles={{
                  input: {
                    backgroundColor: isDark
                      ? 'rgba(9, 10, 13, 0.62)'
                      : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(65, 84, 131, 0.28)',
                  },
                  dropdown: {
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.18)'
                      : 'rgba(65, 84, 131, 0.24)',
                    backgroundColor: isDark
                      ? 'rgba(18, 20, 25, 0.96)'
                      : 'rgba(255, 255, 255, 0.98)',
                  },
                }}
              />
            </Box>
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
                <ThemeIcon variant="light" color="grape" size="lg" radius="md">
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
                combat, strategic Dragon Soul mechanics, and a colorful cast of
                characters.
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
                <Text size="sm" c="dimmed" style={{ wordBreak: 'break-word' }}>
                  {LANGUAGES.join(' · ')}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
