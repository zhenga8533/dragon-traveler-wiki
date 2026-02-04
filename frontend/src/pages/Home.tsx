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
  useMantineColorScheme,
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
  { label: 'Effects', path: '/effects', icon: IoFlash, color: 'orange' },
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
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack gap={0}>
      {/* Hero banner with gradient fade */}
      <Box
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '21 / 9',
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'linear-gradient(to bottom, transparent 40%, var(--mantine-color-body) 100%)'
              : 'linear-gradient(to bottom, transparent 40%, var(--mantine-color-body) 100%)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'linear-gradient(to right, var(--mantine-color-body) 0%, transparent 20%, transparent 80%, var(--mantine-color-body) 100%)'
              : 'linear-gradient(to right, var(--mantine-color-body) 0%, transparent 20%, transparent 80%, var(--mantine-color-body) 100%)',
          }}
        />
      </Box>

      <Container size="md" py="xl" style={{ marginTop: -40, position: 'relative', zIndex: 1 }}>
        <Stack gap="lg">
          <div>
            <Title order={1}>Dragon Traveler Wiki</Title>
            <Text size="lg" c="dimmed" mt="xs">
              A community-driven wiki for Dragon Traveler (龙族旅人).
            </Text>
          </div>

          {/* Game info */}
          <Card padding="lg" radius="md" withBorder>
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

          {/* Quick links */}
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
