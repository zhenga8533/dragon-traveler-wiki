import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  Image,
  NavLink,
  Select,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useHotkeys, useMediaQuery } from '@mantine/hooks';
import { useContext, useMemo } from 'react';
import {
  IoBook,
  IoChevronBack,
  IoChevronForward,
  IoGift,
  IoHome,
  IoLink,
  IoList,
  IoMoon,
  IoServer,
  IoShield,
  IoSunny,
  IoTrophy,
} from 'react-icons/io5';
import {
  HashRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import logo from './assets/logo.png';
import Footer from './components/Footer';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import SearchModal from './components/SearchModal';
import { getAccentForPath, PARENT_ACCENTS } from './constants/accents';
import { getGlassStyles } from './constants/glass';
import { BRAND_TITLE_STYLE } from './constants/styles';
import { SIDEBAR, TRANSITION } from './constants/ui';
import {
  ResourcesProvider,
  SectionAccentProvider,
  TierListReferenceContext,
  TierListReferenceProvider,
} from './contexts';
import { useSidebar } from './hooks';
import Artifacts from './pages/Artifacts';
import BeginnerQA from './pages/BeginnerQA';
import Changelog from './pages/Changelog';
import CharacterPage from './pages/CharacterPage';
import Characters from './pages/Characters';
import Codes from './pages/Codes';
import Home from './pages/Home';
import Howlkins from './pages/Howlkins';
import NoblePhantasms from './pages/NoblePhantasms';
import Resources from './pages/Resources';
import RotationalEventHoarding from './pages/RotationalEventHoarding';
import ShovelEventGuide from './pages/ShovelEventGuide';
import StarUpgradeCalculator from './pages/StarUpgradeCalculator';
import StatusEffects from './pages/StatusEffects';
import TeamPage from './pages/TeamPage';
import Teams from './pages/Teams';
import TierList from './pages/TierList';
import UsefulLinks from './pages/UsefulLinks';
import DragonSpells from './pages/Wyrmspells';

type NavItem = {
  label: string;
  path?: string;
  icon?: React.ComponentType;
  children?: { label: string; path: string; icon?: React.ComponentType }[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', icon: IoHome },
  {
    label: 'Database',
    icon: IoServer,
    children: [
      { label: 'Artifacts', path: '/artifacts' },
      { label: 'Characters', path: '/characters' },
      { label: 'Howlkins', path: '/howlkins' },
      { label: 'Noble Phantasms', path: '/noble-phantasms' },
      { label: 'Resources', path: '/resources' },
      { label: 'Status Effects', path: '/status-effects' },
      { label: 'Wyrmspells', path: '/wyrmspells' },
    ],
  },
  {
    label: 'Guides',
    icon: IoBook,
    children: [
      {
        label: 'Beginner Q&A',
        path: '/guides/beginner-qa',
      },
      {
        label: 'Star Upgrade Calculator',
        path: '/guides/star-upgrade-calculator',
      },
      {
        label: 'Rotational Event Hoarding',
        path: '/guides/rotational-event-hoarding',
      },
      {
        label: 'Shovel Event Guide',
        path: '/guides/shovel-event',
      },
    ],
  },
  { label: 'Tier List', path: '/tier-list', icon: IoTrophy },
  { label: 'Teams', path: '/teams', icon: IoShield },
  { label: 'Codes', path: '/codes', icon: IoGift },
  { label: 'Useful Links', path: '/useful-links', icon: IoLink },
  { label: 'Changelog', path: '/changelog', icon: IoList },
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

// Shared styles for nav items to prevent layout shifting
const NAV_ITEM_HEIGHT = 42;

const collapsedNavStyles = {
  root: {
    justifyContent: 'center',
    height: NAV_ITEM_HEIGHT,
    padding: 'var(--mantine-spacing-xs)',
  },
  section: {
    marginRight: 0,
    marginLeft: 0,
  },
  body: {
    display: 'none',
  },
};

const expandedNavStyles = {
  root: {
    height: NAV_ITEM_HEIGHT,
  },
  section: {
    width: 24,
    minWidth: 24,
    display: 'flex',
    justifyContent: 'center',
  },
};

const getIconColor = (accent: string, isActive: boolean) =>
  `var(--mantine-color-${accent}-${isActive ? '6' : '5'})`;

const renderNavIcon = (
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>,
  accent: string,
  isActive: boolean
) => <Icon size={18} style={{ color: getIconColor(accent, isActive) }} />;

function Navigation({
  onNavigate,
  showLabels,
}: {
  onNavigate: () => void;
  showLabels: boolean;
}) {
  const location = useLocation();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          const isChildActive = item.children.some(
            (child) => location.pathname === child.path
          );
          const parentAccent = PARENT_ACCENTS[item.label];

          // When collapsed, show parent as a tooltip-wrapped icon
          if (!showLabels) {
            return (
              <Tooltip
                key={item.label}
                label={item.label}
                position="right"
                withArrow
              >
                <NavLink
                  label=""
                  leftSection={
                    item.icon &&
                    renderNavIcon(item.icon, parentAccent, isChildActive)
                  }
                  active={isChildActive}
                  color={parentAccent}
                  styles={collapsedNavStyles}
                />
              </Tooltip>
            );
          }

          return (
            <NavLink
              key={item.label}
              label={item.label}
              defaultOpened={isChildActive}
              childrenOffset={28}
              leftSection={
                item.icon &&
                renderNavIcon(item.icon, parentAccent, isChildActive)
              }
              color={parentAccent}
              styles={expandedNavStyles}
            >
              {item.children.map((child) => {
                const childAccent = getAccentForPath(child.path);
                return (
                  <NavLink
                    key={child.path}
                    component={Link}
                    to={child.path}
                    label={child.label}
                    active={location.pathname === child.path}
                    color={childAccent}
                    onClick={onNavigate}
                  />
                );
              })}
            </NavLink>
          );
        }

        const itemAccent = getAccentForPath(item.path!);
        const isActive = location.pathname === item.path;

        if (!showLabels) {
          return (
            <Tooltip
              key={item.path}
              label={item.label}
              position="right"
              withArrow
            >
              <NavLink
                component={Link}
                to={item.path!}
                label=""
                leftSection={
                  item.icon && renderNavIcon(item.icon, itemAccent, isActive)
                }
                active={isActive}
                color={itemAccent}
                onClick={onNavigate}
                styles={collapsedNavStyles}
              />
            </Tooltip>
          );
        }

        return (
          <NavLink
            key={item.path}
            component={Link}
            to={item.path!}
            label={item.label}
            leftSection={
              item.icon && renderNavIcon(item.icon, itemAccent, isActive)
            }
            active={isActive}
            color={itemAccent}
            onClick={onNavigate}
            styles={expandedNavStyles}
          />
        );
      })}
    </>
  );
}

function AppContent() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure();
  const [shortcutsOpened, { open: openShortcuts, close: closeShortcuts }] =
    useDisclosure();
  const sidebar = useSidebar();
  const navigate = useNavigate();
  const isDark = useComputedColorScheme('light') === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { tierLists, loading, selectedTierListName, setSelectedTierListName } =
    useContext(TierListReferenceContext);

  // Global keyboard shortcuts
  useHotkeys([
    ['shift+/', openShortcuts], // ? key
    ['g+h', () => navigate('/')],
    ['g+c', () => navigate('/characters')],
    ['g+t', () => navigate('/tier-list')],
  ]);

  const glassStyles = getGlassStyles(isDark);
  const tierListOptions = useMemo(
    () =>
      tierLists.map((list) => ({
        value: list.name,
        label: `${list.name} (${list.content_type})`,
      })),
    [tierLists]
  );

  // On mobile, always show full sidebar when opened
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
            {/* Sidebar toggle - hidden on mobile */}
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
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'inherit',
              }}
            >
              <Image
                src={logo}
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
              searchable
              size="xs"
              disabled={loading || tierListOptions.length === 0}
              w={220}
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
          <Navigation onNavigate={closeMobile} showLabels={showLabels} />
        </Box>
        <Box hiddenFrom="sm" px="xs" pb="xs" pt="xs" style={{ flexShrink: 0 }}>
          <Select
            placeholder="Tier list reference"
            data={tierListOptions}
            value={selectedTierListName || null}
            onChange={(value) => setSelectedTierListName(value ?? '')}
            clearable
            searchable
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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/artifacts" element={<Artifacts />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/characters/:name" element={<CharacterPage />} />
              <Route path="/howlkins" element={<Howlkins />} />
              <Route path="/noble-phantasms" element={<NoblePhantasms />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/status-effects" element={<StatusEffects />} />
              <Route path="/wyrmspells" element={<DragonSpells />} />
              <Route path="/tier-list" element={<TierList />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:teamName" element={<TeamPage />} />
              <Route path="/codes" element={<Codes />} />
              <Route path="/useful-links" element={<UsefulLinks />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/guides/beginner-qa" element={<BeginnerQA />} />
              <Route
                path="/guides/star-upgrade-calculator"
                element={<StarUpgradeCalculator />}
              />
              <Route
                path="/guides/rotational-event-hoarding"
                element={<RotationalEventHoarding />}
              />
              <Route
                path="/guides/shovel-event"
                element={<ShovelEventGuide />}
              />
            </Routes>
          </PageTransition>
        </Box>
        <Footer />
      </AppShell.Main>

      <ScrollToTop />
      <KeyboardShortcuts opened={shortcutsOpened} onClose={closeShortcuts} />
    </AppShell>
  );
}

export default function App() {
  return (
    <HashRouter>
      <SectionAccentProvider>
        <ResourcesProvider>
          <TierListReferenceProvider>
            <AppContent />
          </TierListReferenceProvider>
        </ResourcesProvider>
      </SectionAccentProvider>
    </HashRouter>
  );
}
