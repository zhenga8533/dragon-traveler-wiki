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
import {
  IoCheckmark,
  IoCopyOutline,
  IoFlash,
  IoGameController,
  IoGlobe,
  IoLink,
  IoList,
  IoPeople,
  IoPricetag,
  IoSearch,
  IoSparkles,
  IoTrophy,
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import banner from '../assets/banner.png';
import CharacterCard from '../components/CharacterCard';
import SearchModal from '../components/SearchModal';
import { TIER_COLOR } from '../constants/colors';
import { BRAND_TITLE_STYLE } from '../constants/styles';
import { useDataFetch } from '../hooks';
import type { Character } from '../types/character';
import type { Code } from '../types/code';
import type { TierList } from '../types/tier-list';

interface ChangelogEntry {
  date: string;
  version?: string;
  changes: {
    type: 'added' | 'updated' | 'fixed' | 'removed';
    category: string;
    description: string;
  }[];
}

const QUICK_LINKS = [
  {
    label: 'Status Effects',
    path: '/status-effects',
    icon: IoFlash,
    color: 'cyan',
  },
  {
    label: 'Wyrmspells',
    path: '/wyrmspells',
    icon: IoSparkles,
    color: 'indigo',
  },
  { label: 'Useful Links', path: '/useful-links', icon: IoLink, color: 'gray' },
  { label: 'Changelog', path: '/changelog', icon: IoList, color: 'grape' },
];

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

function ActiveCodesSection() {
  const { data: codes, loading } = useDataFetch<Code[]>('data/codes.json', []);
  const activeCodes = codes.filter((c) => c.active).slice(0, 5);

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
        <Group
          key={entry.code}
          justify="space-between"
          p="xs"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'var(--mantine-color-default-hover)',
          }}
        >
          <Text ff="monospace" fw={500} size="sm">
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

function TopCharactersSection() {
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
      <Group gap="md">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} height={100} width={80} radius="md" />
        ))}
      </Group>
    );
  }

  // Get S+ and S tier characters from the first tier list
  const tierList = tierLists[0];
  if (!tierList) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No tier list data available.
      </Text>
    );
  }

  const charMap = new Map(characters.map((c) => [c.name, c]));
  const topEntries = tierList.entries
    .filter((e) => e.tier === 'S+' || e.tier === 'S')
    .slice(0, 8);

  const tierListMeta = [
    tierList.name,
    tierList.content_type,
    tierList.author ? `by ${tierList.author}` : null,
  ].filter(Boolean);

  if (topEntries.length === 0) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No top tier characters found.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {tierListMeta.length > 0 && (
        <Text size="xs" c="dimmed">
          {tierListMeta.join(' · ')}
        </Text>
      )}
      <Group gap="md" wrap="wrap">
        {topEntries.map((entry) => {
          const char = charMap.get(entry.character_name);
          return (
            <Stack key={entry.character_name} gap={2} align="center">
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
        })}
      </Group>
      <Group gap="md">
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

  const recentEntries = changelog.slice(0, 3);
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
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600}>
              {entry.version || entry.date}
            </Text>
            <Group gap="xs">
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

export default function Home() {
  const colorScheme = useComputedColorScheme('light');
  const isDark = colorScheme === 'dark';

  return (
    <Stack gap={0}>
      {/* Hero banner with overlapping content */}
      <Box
        style={{
          position: 'relative',
          width: 'calc(100% + var(--mantine-spacing-md) * 2)',
          minHeight: 350,
          marginLeft: 'calc(var(--mantine-spacing-md) * -1)',
          marginRight: 'calc(var(--mantine-spacing-md) * -1)',
          marginTop: 'calc(var(--mantine-spacing-md) * -1)',
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
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${banner})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
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
                  ...BRAND_TITLE_STYLE,
                  fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                  backgroundImage: isDark
                    ? 'linear-gradient(120deg, var(--mantine-color-violet-2) 0%, var(--mantine-color-violet-4) 45%, var(--mantine-color-grape-4) 100%)'
                    : 'linear-gradient(120deg, var(--mantine-color-violet-6) 0%, var(--mantine-color-violet-5) 45%, var(--mantine-color-grape-6) 100%)',
                  textShadow: isDark
                    ? '0 2px 12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.5)'
                    : '0 2px 10px rgba(0, 0, 0, 0.55), 0 0 22px rgba(0, 0, 0, 0.35)',
                }}
              >
                Dragon Traveler Wiki
              </Title>
              <Text
                size="lg"
                mt="xs"
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 6px rgba(0, 0, 0, 0.9)',
                }}
              >
                A community-driven wiki for Dragon Traveler
              </Text>
              <Stack gap="sm" mt="md" align="center">
                <Group gap="sm" justify="center">
                  <Button
                    component={Link}
                    to="/characters"
                    size="md"
                    radius="md"
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
                    leftSection={<IoTrophy size={18} />}
                  >
                    View Tier List
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
                        leftSection={<IoSearch size={16} />}
                      >
                        Search the Wiki
                      </Button>
                    )}
                  />
                  <Group gap={4}>
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
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" size="md" radius="md">
                    <IoGlobe size={16} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">
                    {LANGUAGES.join(' · ')}
                  </Text>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Box>

      {/* Content sections */}
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Top Characters & Active Codes row */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Top Characters */}
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon
                    variant="light"
                    color="orange"
                    size="lg"
                    radius="md"
                  >
                    <IoTrophy size={20} />
                  </ThemeIcon>
                  <Title order={4}>Top Characters</Title>
                </Group>
                <TopCharactersSection />
              </Stack>
            </Card>

            {/* Active Codes */}
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon
                    variant="light"
                    color="yellow"
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
          </SimpleGrid>

          {/* Recent Updates & Quick Links row */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Recent Updates */}
            <Card padding="lg" radius="md" withBorder>
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

            {/* Quick Links */}
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                    <IoPeople size={20} />
                  </ThemeIcon>
                  <Title order={4}>Quick Links</Title>
                </Group>
                <SimpleGrid cols={2} spacing="sm">
                  {QUICK_LINKS.map((item) => (
                    <Card
                      key={item.path}
                      component={Link}
                      to={item.path}
                      padding="sm"
                      radius="md"
                      withBorder
                      style={{
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow =
                          'var(--mantine-shadow-sm)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <Group gap="xs">
                        <ThemeIcon
                          variant="light"
                          color={item.color}
                          size="md"
                          radius="md"
                        >
                          <item.icon size={16} />
                        </ThemeIcon>
                        <Text fw={500} size="sm">
                          {item.label}
                        </Text>
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>
      </Container>
    </Stack>
  );
}
