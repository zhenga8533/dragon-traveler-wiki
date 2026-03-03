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
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  IoChevronBack,
  IoChevronForward,
  IoMoon,
  IoSunny,
} from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';
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
import BannerMediaBackground from '../common/BannerMediaBackground';
import ErrorBoundary from '../common/ErrorBoundary';
import KonamiEasterEgg from '../tools/KonamiEasterEgg';
import SearchModal from '../tools/SearchModal';
import Footer from './Footer';
import Navigation from './Navigation';
import PageTransition from './PageTransition';
import ScrollToTop from './ScrollToTop';

const HOME_BANNER_GLOBAL_ROUTES_STORAGE_KEY =
  'home-banner-global-routes-enabled';
const HOME_BANNER_ACTIVE_SRC_STORAGE_KEY = 'home-banner-active-src';
const HOME_BANNER_ACTIVE_TYPE_STORAGE_KEY = 'home-banner-active-type';
const DETAIL_DATA_ROUTE_PATTERNS = [
  /^\/artifacts\/[^/]+$/,
  /^\/characters\/[^/]+$/,
  /^\/gear-sets\/[^/]+$/,
  /^\/noble-phantasms\/[^/]+$/,
  /^\/teams\/[^/]+$/,
];

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
  const location = useLocation();
  const isDark = useComputedColorScheme('light') === 'dark';
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const [globalBannerEnabled, setGlobalBannerEnabled] = useState(false);
  const [globalBannerSrc, setGlobalBannerSrc] = useState('/banner.png');
  const [globalBannerType, setGlobalBannerType] = useState<'image' | 'video'>(
    'image'
  );
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setGlobalBannerEnabled(
      window.localStorage.getItem(HOME_BANNER_GLOBAL_ROUTES_STORAGE_KEY) ===
        'true'
    );

    const storedSrc =
      window.localStorage.getItem(HOME_BANNER_ACTIVE_SRC_STORAGE_KEY) ||
      '/banner.png';
    setGlobalBannerSrc(storedSrc);

    const storedType = window.localStorage.getItem(
      HOME_BANNER_ACTIVE_TYPE_STORAGE_KEY
    );
    setGlobalBannerType(storedType === 'video' ? 'video' : 'image');
  }, [location.pathname]);

  const isDetailDataRoute = DETAIL_DATA_ROUTE_PATTERNS.some((pattern) =>
    pattern.test(location.pathname)
  );

  const globalRouteBannerHeight = isMobile ? 320 : 350;

  const shouldShowGlobalBanner =
    globalBannerEnabled && location.pathname !== '/' && !isDetailDataRoute;

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
          position: 'relative',
        }}
      >
        {shouldShowGlobalBanner ? (
          <BannerMediaBackground
            isDark={isDark}
            media={{ src: globalBannerSrc, type: globalBannerType }}
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: globalRouteBannerHeight,
              borderRadius: 12,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ) : null}
        <Box style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <PageTransition>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </PageTransition>
        </Box>
        <Box style={{ position: 'relative', zIndex: 1 }}>
          <Footer />
        </Box>
      </AppShell.Main>

      <ScrollToTop />
      <KonamiEasterEgg />
    </AppShell>
  );
}
