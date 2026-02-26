import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Kbd,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useState } from 'react';
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
import SearchModal from '../../components/tools/SearchModal';
import { BRAND_TITLE_STYLE } from '../../constants/styles';
import { TRANSITION } from '../../constants/ui';
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

export default function Home() {
  const isDark = useComputedColorScheme('light') === 'dark';

  const [bannerLoaded, setBannerLoaded] = useState(false);

  return (
    <Stack gap={0}>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .home-cta {
          transition: transform 180ms ${TRANSITION.EASE}, box-shadow 220ms ${TRANSITION.EASE}, filter 180ms ${TRANSITION.EASE};
        }

        .home-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.26);
          filter: saturate(1.04);
        }

        .home-hover-card {
          transition: transform 220ms ${TRANSITION.EASE}, box-shadow 240ms ${TRANSITION.EASE}, border-color 220ms ${TRANSITION.EASE};
        }

        .home-hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
        }

        .home-content-card {
          border: 1px solid transparent;
          background:
            linear-gradient(var(--mantine-color-body), var(--mantine-color-body)) padding-box,
            linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(236, 72, 153, 0.18)) border-box;
        }

        .featured-item {
          transition: transform 200ms ${TRANSITION.EASE}, opacity 200ms ${TRANSITION.EASE};
        }

        .featured-item:hover {
          transform: translateY(-3px);
        }
      `}</style>

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
              background: isDark
                ? 'linear-gradient(135deg, #1a0a2e 0%, #2d1450 30%, #4a1942 60%, #1a0a2e 100%)'
                : 'linear-gradient(135deg, #e8d5f5 0%, #c9a0dc 30%, #b57ecd 60%, #e8d5f5 100%)',
            }}
          />
          {/* Actual banner image (fades in when loaded) */}
          <img
            src="/banner.png"
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
              <Title
                order={1}
                style={{
                  fontFamily: BRAND_TITLE_STYLE.fontFamily,
                  letterSpacing: BRAND_TITLE_STYLE.letterSpacing,
                  fontWeight: 700,
                  fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                  textShadow:
                    '0 2px 16px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.35)',
                }}
              >
                <Text
                  component="span"
                  inherit
                  style={{
                    background:
                      'linear-gradient(135deg, #f5d0fe 0%, #c4b5fd 45%, #93c5fd 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'var(--mantine-color-white)',
                  }}
                >
                  Dragon Traveler
                </Text>{' '}
                <Text component="span" inherit style={{ color: 'var(--mantine-color-white)' }}>
                  Wiki
                </Text>
              </Title>
              <Text
                size="lg"
                mt="xs"
                style={{
                  color: 'rgba(255, 255, 255, 0.92)',
                  fontWeight: 500,
                  textShadow: '0 1px 6px rgba(0, 0, 0, 0.9)',
                }}
              >
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
              <Text
                size="sm"
                mt={6}
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.85)',
                }}
              >
                Authored by{' '}
                <Text component="span" inherit fw={700} c="grape.2">
                  Litee
                </Text>{' '}
                <Text component="span" inherit c="blue.1">
                  (Server: Freya 2)
                </Text>
              </Text>
              <Stack gap="sm" mt="md" align="center">
                <Group gap="sm" justify="center" wrap="wrap">
                  <Button
                    component={Link}
                    to="/characters"
                    size="md"
                    radius="md"
                    className="home-cta"
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
                    className="home-cta"
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
                    className="home-cta"
                    leftSection={<IoGameController size={18} />}
                    rightSection={<IoOpenOutline size={14} />}
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      color: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(4px)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Play Now
                  </Button>
                </Group>
                <Group gap="xs" justify="center">
                  <SearchModal
                    trigger={({ open }) => (
                      <Button
                        onClick={open}
                        size="sm"
                        radius="md"
                        variant="white"
                        color="dark"
                        className="home-cta"
                        leftSection={<IoSearch size={16} />}
                      >
                        Search the Wiki
                      </Button>
                    )}
                  />
                  <Group gap={4} visibleFrom="sm">
                    <Text
                      size="xs"
                      style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    >
                      or press
                    </Text>
                    <Kbd size="xs">/</Kbd>
                    <Text
                      size="xs"
                      style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    >
                      or
                    </Text>
                    <Kbd size="xs">Ctrl</Kbd>
                    <Kbd size="xs">K</Kbd>
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
              className="home-hover-card home-content-card"
              style={{
                backdropFilter: 'blur(8px)',
                backgroundColor: isDark
                  ? 'rgba(20, 21, 23, 0.92)'
                  : 'rgba(255, 255, 255, 0.9)',
              }}
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
                  <Title order={3}>About the Game</Title>
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
                className="home-hover-card home-content-card"
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
                    <Title order={4}>Active Codes</Title>
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
                className="home-hover-card home-content-card"
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
                    <Title order={4}>Recent Updates</Title>
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
