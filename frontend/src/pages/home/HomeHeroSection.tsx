import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Kbd,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useContext } from 'react';
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
  HOME_HERO_TITLE_STYLE,
  getCardHoverProps,
  getHomeHeroMetaTextStyle,
  getHomeHeroPlayNowStyle,
  getHomeHeroSubtitleStyle,
  getHomeHeroWordmarkStyle,
} from '../../constants/styles';
import { BREAKPOINTS, TRANSITION } from '../../constants/ui';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';

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

const HOME_HERO_HEADING_PANEL_STYLE = {
  width: '100%',
  maxWidth: 760,
  marginInline: 'auto',
  padding: '20px 22px',
  borderRadius: 14,
};

export default function HomeHeroSection() {
  const isDark = useComputedColorScheme('light') === 'dark';
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];

  const headingPanelStyle = {
    ...HOME_HERO_HEADING_PANEL_STYLE,
    border: '1px solid transparent',
    background: `${
      isDark
        ? 'var(--dt-home-hero-panel-dark)'
        : 'var(--dt-home-hero-panel-light)'
    } padding-box, linear-gradient(135deg, var(--dt-surface-glow-a), var(--dt-surface-glow-b)) border-box`,
    backdropFilter: 'blur(7px)',
    boxShadow: isDark
      ? '0 10px 30px rgba(0, 0, 0, 0.34)'
      : '0 10px 24px rgba(38, 52, 84, 0.16)',
  };

  const homeHeroWordmarkStyle = getHomeHeroWordmarkStyle(isDark);
  const homeHeroSubtitleStyle = getHomeHeroSubtitleStyle(isDark);
  const homeHeroMetaTextStyle = getHomeHeroMetaTextStyle(isDark);
  const homeHeroPlayNowStyle = getHomeHeroPlayNowStyle(isDark);

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
      <Container
        size="md"
        style={{ position: 'relative', zIndex: 1, width: '100%' }}
        py={{ base: 'lg', sm: 'xl' }}
      >
        <Stack gap={isMobile ? 'md' : 'lg'}>
          <Box style={{ textAlign: 'center' }}>
            <Box style={headingPanelStyle}>
              <Group justify="center" mb={10}>
                <Badge
                  radius="xl"
                  variant="gradient"
                  gradient={{
                    from: accent.secondary,
                    to: accent.primary,
                    deg: 110,
                  }}
                  style={{ letterSpacing: 0.3 }}
                >
                  Community Resource Hub
                </Badge>
              </Group>
              <Title order={1} style={HOME_HERO_TITLE_STYLE}>
                <Text component="span" inherit style={homeHeroWordmarkStyle}>
                  Dragon Traveler
                </Text>{' '}
                <Text
                  component="span"
                  inherit
                  style={{
                    color: isDark
                      ? 'var(--mantine-color-white)'
                      : 'var(--mantine-color-dark-9)',
                  }}
                >
                  Wiki
                </Text>
              </Title>
              <Text size="lg" mt="xs" style={homeHeroSubtitleStyle}>
                A{' '}
                <Text
                  component="span"
                  inherit
                  fw={700}
                  style={{
                    color: isDark
                      ? `var(--mantine-color-${accent.primary}-1)`
                      : `var(--mantine-color-${accent.primary}-8)`,
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
                    color: isDark
                      ? 'var(--mantine-color-blue-1)'
                      : 'var(--mantine-color-blue-8)',
                  }}
                >
                  Dragon Traveler
                </Text>
              </Text>
              <Text size="sm" mt={6} style={homeHeroMetaTextStyle}>
                Authored by{' '}
                <Text
                  component="span"
                  inherit
                  fw={700}
                  c={isDark ? 'grape.2' : 'grape.8'}
                >
                  Litee
                </Text>{' '}
                <Text component="span" inherit c={isDark ? 'blue.1' : 'blue.8'}>
                  (Server: Freya 2)
                </Text>
              </Text>
              <Group justify="center" gap={8} mt="sm" wrap="wrap">
                <Badge variant="light" color={accent.primary} radius="xl">
                  Character Builds
                </Badge>
                <Badge variant="light" color={accent.secondary} radius="xl">
                  Team Tools
                </Badge>
                <Badge variant="light" color={accent.tertiary} radius="xl">
                  Codes & Updates
                </Badge>
              </Group>
            </Box>
            <Stack gap="sm" mt="md" align="center" w="100%">
              <Group
                gap="sm"
                justify="center"
                wrap="wrap"
                style={{ width: '100%', maxWidth: isMobile ? 440 : undefined }}
              >
                <Button
                  component={Link}
                  to="/characters"
                  size="md"
                  fullWidth={isMobile}
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
                  fullWidth={isMobile}
                  radius="md"
                  variant="light"
                  color={accent.primary}
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
                  style={homeHeroPlayNowStyle}
                >
                  Play Now
                </Button>
              </Group>
              <Group
                gap="xs"
                justify="center"
                style={{ width: '100%', maxWidth: isMobile ? 440 : undefined }}
              >
                <SearchModal
                  enableHotkeys={false}
                  trigger={({ open }) => (
                    <Button
                      onClick={open}
                      size={isMobile ? 'md' : 'sm'}
                      fullWidth={isMobile}
                      radius="md"
                      variant="light"
                      color={accent.primary}
                      styles={HOME_CTA_BUTTON_STYLES}
                      leftSection={<IoSearch size={16} />}
                      style={{ minHeight: isMobile ? 44 : undefined }}
                    >
                      Search the Wiki
                    </Button>
                  )}
                />
                <Group gap={4} visibleFrom="sm">
                  <Text size="xs" style={homeHeroMetaTextStyle}>
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
                  ? 'var(--dt-home-hero-card-dark)'
                  : 'var(--dt-home-hero-card-light)',
              },
            })}
          >
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon
                  variant="light"
                  color={accent.primary}
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
                  color={accent.secondary}
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
