import { Link } from 'react-router-dom';
import {
  Title,
  Text,
  Container,
  Stack,
  SimpleGrid,
  Card,
  Group,
  ThemeIcon,
  Badge,
  Box,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IoPeople,
  IoTrophy,
  IoPricetag,
  IoNewspaper,
  IoLink,
  IoFlash,
  IoShield,
  IoSparkles,
  IoGameController,
  IoGlobe,
} from 'react-icons/io5';
import banner from '../assets/banner.png';

const QUICK_LINKS = [
  { label: 'Characters', path: '/characters', icon: IoPeople, color: 'blue' },
  { label: 'Tier List', path: '/tier-list', icon: IoTrophy, color: 'yellow' },
  { label: 'Teams', path: '/teams', icon: IoShield, color: 'green' },
  { label: 'Status Effects', path: '/status-effects', icon: IoFlash, color: 'orange' },
  { label: 'Dragon Spells', path: '/dragon-spells', icon: IoSparkles, color: 'violet' },
  { label: 'Codes', path: '/codes', icon: IoPricetag, color: 'teal' },
  { label: 'Useful Links', path: '/useful-links', icon: IoLink, color: 'cyan' },
  { label: 'News', path: '/news', icon: IoNewspaper, color: 'pink' },
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
              background: 'linear-gradient(to bottom, transparent 40%, var(--mantine-color-body) 100%)',
            }}
          />
          {/* Side gradient fades */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, var(--mantine-color-body) 0%, transparent 10%, transparent 90%, var(--mantine-color-body) 100%)',
            }}
          />
        </Box>

        {/* Content that overlaps the banner */}
        <Container size="md" style={{ position: 'relative', zIndex: 1 }} pt={60} pb="xl">
          <Stack gap="lg">
            {/* Title */}
            <Box style={{ textAlign: 'center' }}>
              <Title
                order={1}
                style={{
                  fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                  color: 'white',
                  textShadow: '0 2px 12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.5)',
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
                A community-driven wiki for Dragon Traveler (龙族旅人)
              </Text>
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
                  ? 'rgba(37, 38, 43, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon variant="light" color="grape" size="lg" radius="md">
                    <IoGameController size={20} />
                  </ThemeIcon>
                  <Title order={3}>About the Game</Title>
                </Group>
                <Text size="sm" fs="italic" c="dimmed">
                  Love x Comedy x Isekai = The Ultimate Bishoujo RPG!
                </Text>
                <Text size="sm">
                  Dragon Traveler is a free-to-play idle RPG developed and published
                  by GameTree. Play as Fafnir, heir of the legendary dragon, in a rom-com
                  isekai adventure featuring card-based combat, strategic Dragon Soul mechanics,
                  and a colorful cast of characters. Battles last just three minutes — no stress, all laughs.
                </Text>
                <Text size="sm">
                  Available on Android, iOS, and PC with Japanese voice acting and subtitles
                  in seven languages.
                </Text>
                <Group gap="xs" wrap="wrap">
                  {GENRES.map((genre) => (
                    <Badge key={genre} variant="light" size="sm">{genre}</Badge>
                  ))}
                  <Badge variant="light" color="green" size="sm">Free to Play</Badge>
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

            <Text size="xs" c="dimmed" fs="italic">
              This is a fan-made project and is not affiliated with or endorsed by GameTree.
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Quick links section - below the hero */}
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Title order={3}>Explore</Title>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            {QUICK_LINKS.map((item) => (
              <Card
                key={item.path}
                component={Link}
                to={item.path}
                padding="lg"
                radius="md"
                withBorder
                style={{ textDecoration: 'none' }}
              >
                <Stack align="center" gap="xs">
                  <ThemeIcon variant="light" color={item.color} size="xl" radius="md">
                    <item.icon size={22} />
                  </ThemeIcon>
                  <Text fw={500} size="sm" ta="center">
                    {item.label}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Stack>
  );
}
