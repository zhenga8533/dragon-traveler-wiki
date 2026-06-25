import { OPEN_GLOBAL_SEARCH_EVENT } from '@/components/tools/LazySearchModal';
import {
  HOME_HERO_TITLE_STYLE,
  getHomeHeroMetaTextStyle,
  getHomeHeroPlayNowStyle,
  getHomeHeroSubtitleStyle,
  getHomeHeroWordmarkStyle,
} from '@/constants/home-styles';
import { IMAGE_SIZE, TRANSITION } from '@/constants/ui';
import { useDarkMode, useGradientAccent, useIsMobile } from '@/hooks';
import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Kbd,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IoGameController,
  IoOpenOutline,
  IoPeople,
  IoSearch,
  IoTrophy,
} from 'react-icons/io5';
import { Link } from 'react-router-dom';

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

export default function HomeHeroSection() {
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const { accent } = useGradientAccent();

  const homeHeroWordmarkStyle = getHomeHeroWordmarkStyle(isDark);
  const homeHeroSubtitleStyle = getHomeHeroSubtitleStyle(isDark);
  const homeHeroMetaTextStyle = getHomeHeroMetaTextStyle(isDark);
  const homeHeroPlayNowStyle = getHomeHeroPlayNowStyle(isDark);

  // Bleed to edges by exactly matching the AppShell.Main padding on each breakpoint.
  const negMargin = `calc(var(--mantine-spacing-${isMobile ? 'sm' : 'md'}) * -1)`;

  return (
    <Box
      style={{
        position: 'relative',
        minHeight: isMobile ? 430 : 520,
        marginLeft: negMargin,
        marginRight: negMargin,
        marginTop: negMargin,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container
        size="lg"
        style={{ position: 'relative', zIndex: 1, width: '100%' }}
        py={{ base: 'xl', sm: 72 }}
      >
        <Stack
          gap="lg"
          maw={760}
          align={isMobile ? 'center' : 'flex-start'}
          style={{ textAlign: isMobile ? 'center' : 'left' }}
        >
          <Stack gap="sm" align={isMobile ? 'center' : 'flex-start'}>
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
            <Text size="lg" style={homeHeroSubtitleStyle}>
              A{' '}
              <Text
                component="span"
                inherit
                fw={700}
                style={{
                  color: isDark
                    ? 'var(--mantine-primary-color-1)'
                    : 'var(--mantine-primary-color-8)',
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
                    ? `var(--mantine-color-${accent.secondary}-1)`
                    : `var(--mantine-color-${accent.secondary}-8)`,
                }}
              >
                Dragon Traveler
              </Text>
            </Text>
            <Text size="sm" style={homeHeroMetaTextStyle}>
              Authored by{' '}
              <Text
                component="span"
                inherit
                fw={700}
                style={{
                  color: isDark
                    ? `var(--mantine-color-${accent.tertiary}-2)`
                    : `var(--mantine-color-${accent.tertiary}-8)`,
                }}
              >
                Litee
              </Text>{' '}
              <Text
                component="span"
                inherit
                style={{
                  color: isDark
                    ? `var(--mantine-color-${accent.secondary}-1)`
                    : `var(--mantine-color-${accent.secondary}-8)`,
                }}
              >
                (Server: Freya 2)
              </Text>
            </Text>
            <Group
              justify={isMobile ? 'center' : 'flex-start'}
              gap={8}
              wrap="wrap"
            >
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
          </Stack>

          <Stack gap="sm" align={isMobile ? 'center' : 'flex-start'} style={{ width: '100%' }}>
            <Group
              gap="sm"
              justify={isMobile ? 'center' : 'flex-start'}
              wrap="wrap"
              style={{ maxWidth: isMobile ? 440 : undefined }}
            >
              <Button
                component={Link}
                to="/characters"
                size="md"
                fullWidth={isMobile}
                color={accent.primary}
                styles={HOME_CTA_BUTTON_STYLES}
                leftSection={<IoPeople size={IMAGE_SIZE.ICON_LG} />}
              >
                Browse Characters
              </Button>
              <Button
                component={Link}
                to="/tier-list"
                size="md"
                fullWidth={isMobile}
                variant="light"
                color={accent.primary}
                styles={HOME_CTA_BUTTON_STYLES}
                leftSection={<IoTrophy size={IMAGE_SIZE.ICON_LG} />}
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
                variant="outline"
                color="gray"
                styles={HOME_CTA_BUTTON_STYLES}
                leftSection={<IoGameController size={IMAGE_SIZE.ICON_LG} />}
                rightSection={<IoOpenOutline size={14} />}
                style={homeHeroPlayNowStyle}
              >
                Play Now
              </Button>
            </Group>
            <Group
              gap="xs"
              justify={isMobile ? 'center' : 'flex-start'}
              style={{ maxWidth: isMobile ? 440 : undefined }}
            >
              <Button
                onClick={() =>
                  window.dispatchEvent(new Event(OPEN_GLOBAL_SEARCH_EVENT))
                }
                size={isMobile ? 'md' : 'sm'}
                fullWidth={isMobile}
                variant="light"
                color={accent.primary}
                styles={HOME_CTA_BUTTON_STYLES}
                leftSection={<IoSearch size={16} />}
                style={{ minHeight: isMobile ? 44 : undefined }}
              >
                Search the Wiki
              </Button>
              <Group gap={4} visibleFrom="sm">
                <Text size="xs" style={homeHeroMetaTextStyle}>
                  press
                </Text>
                <Kbd size="xs">/</Kbd>
              </Group>
            </Group>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
