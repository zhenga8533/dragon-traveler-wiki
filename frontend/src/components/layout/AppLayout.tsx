import KonamiEasterEgg from '@/components/tools/KonamiEasterEgg';
import SearchModal from '@/components/tools/SearchModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { getGlassStyles } from '@/constants/glass';
import { BRAND_TITLE_STYLE, LINK_BLOCK_RESET_STYLE } from '@/constants/styles';
import {
  DETAIL_ROUTE_PATTERNS,
  HEADER_HEIGHT,
  MOBILE_NAV_HEIGHT,
  SIDEBAR,
  TRANSITION,
} from '@/constants/ui';
import { BannerContext } from '@/contexts';
import { useDarkMode, useIsMobile, useSidebar } from '@/hooks';
import AppRoutes from '@/routes/AppRoutes';
import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  Image,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useContext } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';
import BannerBackground from './BannerBackground';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import Navigation from './Navigation';
import PageTransition from './PageTransition';
import ScrollToTop from './ScrollToTop';
import SettingsPanel from './SettingsPanel';

function isBaseRoute(pathname: string): boolean {
  return !DETAIL_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export default function AppLayout() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure();
  const sidebar = useSidebar();
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const { selectedBanner, showOnAllRoutes } = useContext(BannerContext);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const showBanner =
    selectedBanner !== null &&
    (isHome || (showOnAllRoutes && isBaseRoute(location.pathname)));

  const glassStyles = getGlassStyles(isDark);

  const showLabels = isMobile ? true : sidebar.showLabels;
  const navbarWidth = isMobile
    ? SIDEBAR.WIDTH_EXPANDED
    : sidebar.effectiveWidth;

  return (
    <AppShell
      header={{
        height: { base: HEADER_HEIGHT.MOBILE, sm: HEADER_HEIGHT.DESKTOP },
      }}
      navbar={{
        width: navbarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding={{ base: 'sm', sm: 'md' }}
      transitionDuration={parseInt(TRANSITION.NORMAL)}
      transitionTimingFunction={TRANSITION.EASE}
      style={{ minHeight: '100dvh' }}
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
            <SearchModal />
            <SettingsPanel />
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
          {/* Spacer so the last nav items don't sit behind the fixed mobile
               bottom nav when the sidebar is scrolled to the bottom.
               Hidden in landscape because the bottom nav is also hidden there. */}
          {!isLandscape && (
            <Box
              hiddenFrom="sm"
              style={{
                height: `calc(${MOBILE_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
          )}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          position: 'relative',
          overflow: 'clip',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 22%), var(--mantine-color-body)',
        }}
      >
        {showBanner && <BannerBackground />}
        {/* flex:1 fills remaining Main height so the Footer stays at the bottom */}
        <Box style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0 }}>
          <PageTransition>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </PageTransition>
        </Box>
        <Footer />
        {/* Spacer placed AFTER the footer so the fixed mobile bottom nav
             doesn't overlap footer content when scrolled to the bottom.
             Hidden in landscape because the bottom nav is also hidden there. */}
        {!isLandscape && (
          <Box
            hiddenFrom="sm"
            style={{
              height: `calc(${MOBILE_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
            }}
            aria-hidden="true"
          />
        )}
      </AppShell.Main>

      <ScrollToTop />
      <KonamiEasterEgg />
      <MobileBottomNav />
    </AppShell>
  );
}
