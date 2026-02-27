import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  Image,
  Select,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useContext, useMemo } from 'react';
import {
  IoChevronBack,
  IoChevronForward,
  IoMoon,
  IoSunny,
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { normalizeContentType } from '../../constants/content-types';
import { getGlassStyles } from '../../constants/glass';
import {
  BRAND_TITLE_STYLE,
  LINK_BLOCK_RESET_STYLE,
} from '../../constants/styles';
import {
  BREAKPOINTS,
  HEADER_SELECT_WIDTH,
  SIDEBAR,
  TRANSITION,
} from '../../constants/ui';
import { TierListReferenceContext } from '../../contexts';
import { useSidebar } from '../../hooks';
import AppRoutes from '../../routes/AppRoutes';
import ErrorBoundary from '../common/ErrorBoundary';
import KonamiEasterEgg from '../tools/KonamiEasterEgg';
import SearchModal from '../tools/SearchModal';
import Footer from './Footer';
import Navigation from './Navigation';
import PageTransition from './PageTransition';
import ScrollToTop from './ScrollToTop';

function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={toggleColorScheme}
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'dark' ? <IoSunny /> : <IoMoon />}
    </ActionIcon>
  );
}

export default function AppLayout() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure();
  const sidebar = useSidebar();
  const isDark = useComputedColorScheme('light') === 'dark';
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { tierLists, loading, selectedTierListName, setSelectedTierListName } =
    useContext(TierListReferenceContext);

  const glassStyles = getGlassStyles(isDark);
  const tierListOptions = useMemo(
    () =>
      tierLists.map((list) => ({
        value: list.name,
        label: `${list.name} (${normalizeContentType(list.content_type, 'All')})`,
      })),
    [tierLists]
  );

  const showLabels = isMobile ? true : sidebar.showLabels;
  const navbarWidth = isMobile
    ? SIDEBAR.WIDTH_EXPANDED
    : sidebar.effectiveWidth;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: navbarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
      transitionDuration={parseInt(TRANSITION.NORMAL)}
      transitionTimingFunction={TRANSITION.EASE}
    >
      <AppShell.Header style={glassStyles}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ overflow: 'hidden' }}>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Tooltip
              label={
                sidebar.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
              position="right"
            >
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={sidebar.toggle}
                aria-label="Toggle sidebar"
                visibleFrom="sm"
              >
                {sidebar.isCollapsed ? <IoChevronForward /> : <IoChevronBack />}
              </ActionIcon>
            </Tooltip>
            <Link
              to="/"
              style={{
                ...LINK_BLOCK_RESET_STYLE,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Image
                src="/logo.png"
                alt="Dragon Traveler Wiki"
                h={{ base: 32, xs: 40, sm: 48 }}
                w="auto"
                fit="contain"
                style={{ maxWidth: '45vw' }}
              />
              <Title order={3} visibleFrom="sm" style={BRAND_TITLE_STYLE}>
                Dragon Traveler Wiki
              </Title>
            </Link>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Select
              placeholder="Tier list reference"
              data={tierListOptions}
              value={selectedTierListName || null}
              onChange={(value) => setSelectedTierListName(value ?? '')}
              clearable
              size="xs"
              disabled={loading || tierListOptions.length === 0}
              w={HEADER_SELECT_WIDTH}
              visibleFrom="sm"
            />
            <SearchModal />
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="xs"
        style={{ ...glassStyles, display: 'flex', flexDirection: 'column' }}
        onMouseEnter={() => sidebar.setHovered(true)}
        onMouseLeave={() => sidebar.setHovered(false)}
      >
        <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Navigation
            onNavigate={closeMobile}
            showLabels={showLabels}
            onExpand={() => sidebar.setCollapsed(false)}
          />
        </Box>
        <Box hiddenFrom="sm" px="xs" pb="xs" pt="xs" style={{ flexShrink: 0 }}>
          <Select
            placeholder="Tier list reference"
            data={tierListOptions}
            value={selectedTierListName || null}
            onChange={(value) => setSelectedTierListName(value ?? '')}
            clearable
            size="xs"
            disabled={loading || tierListOptions.length === 0}
          />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Box style={{ flex: 1 }}>
          <PageTransition>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </PageTransition>
        </Box>
        <Footer />
      </AppShell.Main>

      <ScrollToTop />
      <KonamiEasterEgg />
    </AppShell>
  );
}
