import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  CopyButton,
  Group,
  Kbd,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import {
  IoCheckmark,
  IoCopyOutline,
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
import banner from '../assets/banner.png';
import CharacterCard from '../components/CharacterCard';
import LastUpdated from '../components/LastUpdated';
import ResourceBadge from '../components/ResourceBadge';
import SearchModal from '../components/SearchModal';
import { TIER_COLOR } from '../constants/colors';
import { BRAND_TITLE_STYLE } from '../constants/styles';
import { TRANSITION } from '../constants/ui';
import { useDataFetch, useScrollReveal } from '../hooks';
import type { Character } from '../types/character';
import type { Code } from '../types/code';
import type { StatusEffect } from '../types/status-effect';
import type { Team } from '../types/team';
import type { TierList } from '../types/tier-list';
import type { Wyrmspell } from '../types/wyrmspell';

interface ChangelogEntry {
  date: string;
  version?: string;
  changes: {
    type: 'added' | 'updated' | 'fixed' | 'removed';
    category: string;
    description: string;
  }[];
}

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

const TYPE_COLORS: Record<string, string> = {
  added: 'green',
  updated: 'blue',
  fixed: 'orange',
  removed: 'red',
};

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function DataStatsBar() {
  const { data: characters, loading: l1 } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: wyrmspells, loading: l2 } = useDataFetch<Wyrmspell[]>(
    'data/wyrmspells.json',
    []
  );
  const { data: statusEffects, loading: l3 } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );
  const { data: teams, loading: l4 } = useDataFetch<Team[]>(
    'data/teams.json',
    []
  );
  const { data: codes, loading: l5 } = useDataFetch<Code[]>(
    'data/codes.json',
    []
  );
  const { data: tierLists, loading: l6 } = useDataFetch<TierList[]>(
    'data/tier-lists.json',
    []
  );

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const list of [characters, wyrmspells, statusEffects, teams, codes, tierLists]) {
      for (const item of list) {
        if (item.last_updated > latest) latest = item.last_updated;
      }
    }
    return latest;
  }, [characters, wyrmspells, statusEffects, teams, codes, tierLists]);

  if (l1 || l2 || l3 || l4 || l5 || l6) {
    return (
      <Group justify="center" py="md">
        <Skeleton height={20} width="100%" maw={400} radius="md" />
      </Group>
    );
  }

  const stats = [
    `${characters.length} Characters`,
    `${wyrmspells.length} Wyrmspells`,
    `${statusEffects.length} Status Effects`,
    `${teams.length} Teams`,
  ];

  return (
    <Stack gap={4} align="center" py="md">
      <Text ta="center" size="sm" c="dimmed">
        {stats.join(' \u00b7 ')}
      </Text>
      <LastUpdated timestamp={mostRecentUpdate} />
    </Stack>
  );
}

function FeaturedCharactersMarquee() {
  const { data: tierLists, loading: loadingTiers } = useDataFetch<TierList[]>(
    'data/tier-lists.json',
    []
  );
  const { data: characters, loading: loadingChars } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  const loading = loadingTiers || loadingChars;

  if (loading) {
    return (
      <Group gap="md" justify="center" wrap="wrap">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={100} width={80} radius="md" />
        ))}
      </Group>
    );
  }

  const tierList = tierLists[0];
  if (!tierList) return null;

  const charMap = new Map(characters.map((c) => [c.name, c]));
  const topEntries = tierList.entries.filter(
    (e) => e.tier === 'S+' || e.tier === 'S'
  );

  if (topEntries.length === 0) return null;

  const renderCharacters = (keyPrefix: string) =>
    topEntries.map((entry) => {
      const char = charMap.get(entry.character_name);
      return (
        <Stack
          key={`${keyPrefix}-${entry.character_name}`}
          className="featured-item"
          gap={2}
          align="center"
          style={{ flexShrink: 0, width: 90 }}
        >
          <CharacterCard
            name={entry.character_name}
            quality={char?.quality}
            size={64}
          />
          <Badge size="xs" variant="light" color={TIER_COLOR[entry.tier]}>
            {entry.tier}
          </Badge>
        </Stack>
      );
    });

  const duration = topEntries.length * 3;

  const tierListMeta = [
    tierList.name,
    tierList.content_type,
    tierList.author ? `by ${tierList.author}` : null,
  ].filter(Boolean);

  return (
    <Stack gap="md">
      <Group gap="sm" justify="center">
        <ThemeIcon variant="light" color="grape" size="lg" radius="md">
          <IoTrophy size={20} />
        </ThemeIcon>
        <Title order={4}>Featured Characters</Title>
      </Group>
      {tierListMeta.length > 0 && (
        <Text size="xs" c="dimmed" ta="center">
          {tierListMeta.join(' \u00b7 ')}
        </Text>
      )}
      <Box
        style={{
          overflow: 'hidden',
          width: '100%',
          contain: 'inline-size',
          maskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
      >
        <Group
          gap="md"
          wrap="nowrap"
          style={{
            animation: `marquee-scroll ${duration}s linear infinite`,
            width: 'max-content',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.animationPlayState = 'running';
          }}
        >
          {renderCharacters('a')}
          {renderCharacters('b')}
        </Group>
      </Box>
      <Group gap="md" justify="center">
        <Text
          component={Link}
          to="/tier-list"
          size="xs"
          c="dimmed"
          td="underline"
        >
          View full tier list
        </Text>
        <Text
          component={Link}
          to="/characters"
          size="xs"
          c="dimmed"
          td="underline"
        >
          Browse all characters
        </Text>
      </Group>
    </Stack>
  );
}

function ActiveCodesSection() {
  const { data: codes, loading } = useDataFetch<Code[]>('data/codes.json', []);
  const activeCodes = codes.filter((c) => c.active).reverse().slice(0, 5);

  if (loading) {
    return (
      <Stack gap="xs">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={40} radius="md" />
        ))}
      </Stack>
    );
  }

  if (activeCodes.length === 0) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No active codes at the moment.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {activeCodes.map((entry) => (
        <Box
          key={entry.code}
          p="xs"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'var(--mantine-color-default-hover)',
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text ff="monospace" fw={500} size="sm" truncate>
              {entry.code}
            </Text>
            <CopyButton value={entry.code} timeout={1500}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color={copied ? 'teal' : 'gray'}
                    size="sm"
                    onClick={copy}
                  >
                    {copied ? (
                      <IoCheckmark size={14} />
                    ) : (
                      <IoCopyOutline size={14} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          {(entry.rewards ?? entry.reward ?? []).length > 0 && (
            <Group gap={4} mt={4} wrap="wrap">
              {(entry.rewards ?? entry.reward ?? []).map((r) => (
                <ResourceBadge
                  key={r.name}
                  name={r.name}
                  quantity={r.quantity}
                  size="xs"
                />
              ))}
            </Group>
          )}
        </Box>
      ))}
      <Text
        component={Link}
        to="/codes"
        size="xs"
        c="dimmed"
        td="underline"
        style={{ alignSelf: 'flex-end' }}
      >
        View all codes
      </Text>
    </Stack>
  );
}

function RecentUpdatesSection() {
  const { data: changelog, loading } = useDataFetch<ChangelogEntry[]>(
    'data/changelog.json',
    []
  );

  if (loading) {
    return (
      <Stack gap="xs">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={60} radius="md" />
        ))}
      </Stack>
    );
  }

  const recentEntries = [...changelog].reverse().slice(0, 3);
  const latestEntry = recentEntries[0];

  if (recentEntries.length === 0) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No recent updates.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {latestEntry && (
        <Text size="xs" c="dimmed">
          Latest update: {latestEntry.version || latestEntry.date} ·{' '}
          {latestEntry.changes.length} changes
        </Text>
      )}
      {recentEntries.map((entry, idx) => (
        <Box
          key={idx}
          p="xs"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'var(--mantine-color-default-hover)',
          }}
        >
          <Group justify="space-between" mb={4} wrap="wrap" gap={4}>
            <Text size="xs" fw={600}>
              {entry.version || entry.date}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Badge size="xs" variant="light" color="gray">
                {entry.changes.length} changes
              </Badge>
              <Text size="xs" c="dimmed">
                {entry.date}
              </Text>
            </Group>
          </Group>
          <Stack gap={2}>
            {entry.changes.slice(0, 2).map((change, cIdx) => (
              <Group key={cIdx} gap="xs" wrap="nowrap">
                <Badge
                  size="xs"
                  variant="light"
                  color={TYPE_COLORS[change.type] || 'gray'}
                  style={{ flexShrink: 0 }}
                >
                  {change.type}
                </Badge>
                <Text size="xs" lineClamp={1}>
                  {change.description}
                </Text>
              </Group>
            ))}
            {entry.changes.length > 2 && (
              <Text size="xs" c="dimmed" fs="italic">
                +{entry.changes.length - 2} more changes
              </Text>
            )}
          </Stack>
        </Box>
      ))}
      <Text
        component={Link}
        to="/changelog"
        size="xs"
        c="dimmed"
        td="underline"
        style={{ alignSelf: 'flex-end' }}
      >
        View full changelog
      </Text>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

export default function Home() {
  const colorScheme = useComputedColorScheme('light');
  const isDark = colorScheme === 'dark';

  const [bannerLoaded, setBannerLoaded] = useState(false);

  const marqueeReveal = useScrollReveal({ staggerIndex: 0 });
  const codesReveal = useScrollReveal({ staggerIndex: 0 });
  const updatesReveal = useScrollReveal({ staggerIndex: 1 });

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
            src={banner}
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
                    color: '#fff',
                  }}
                >
                  Dragon Traveler
                </Text>{' '}
                <Text component="span" inherit style={{ color: '#ffffff' }}>
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
                  style={{
                    color: '#e9d5ff',
                  }}
                >
                  community-driven
                </Text>{' '}
                wiki for{' '}
                <Text
                  component="span"
                  inherit
                  fw={700}
                  style={{
                    color: '#bfdbfe',
                  }}
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

                <Group
                  gap="xs"
                  justify="center"
                  wrap="wrap"
                  style={{ rowGap: 6 }}
                >
                  <Badge
                    variant="outline"
                    color="grape"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      color: 'rgba(255, 255, 255, 0.95)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    Updated daily
                  </Badge>
                  <Badge
                    variant="outline"
                    color="grape"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      color: 'rgba(255, 255, 255, 0.95)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    Community curated
                  </Badge>
                  <Badge
                    variant="outline"
                    color="grape"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      color: 'rgba(255, 255, 255, 0.95)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    Fast search
                  </Badge>
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

      {/* Data stats bar */}
      <Container size="lg">
        <DataStatsBar />
      </Container>

      {/* Content sections */}
      <Container size="lg" py="xl" mt="md">
        <Stack gap="xl">
          {/* Featured Characters Marquee */}
          <Stack gap="xs">
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" ta="center">
              Top picks this cycle
            </Text>
            <Box ref={marqueeReveal.ref} style={marqueeReveal.style}>
              <FeaturedCharactersMarquee />
            </Box>
          </Stack>

          {/* Active Codes & Recent Updates row */}
          <Stack gap="xs">
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" ta="center">
              Quick intel
            </Text>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Box ref={codesReveal.ref} style={codesReveal.style}>
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

              <Box ref={updatesReveal.ref} style={updatesReveal.style}>
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
        </Stack>
      </Container>
    </Stack>
  );
}
