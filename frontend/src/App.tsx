import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  Image,
  NavLink,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IoBook,
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
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import logo from './assets/logo.png';
import Footer from './components/Footer';
import SearchModal from './components/SearchModal';
import BeginnerQA from './pages/BeginnerQA';
import Changelog from './pages/Changelog';
import CharacterPage from './pages/CharacterPage';
import Characters from './pages/Characters';
import Codes from './pages/Codes';
import DragonSpells from './pages/DragonSpells';
import EfficientSpending from './pages/EfficientSpending';
import GoldenCloverPriority from './pages/GoldenCloverPriority';
import Home from './pages/Home';
import StarUpgradeCalculator from './pages/StarUpgradeCalculator';
import StatusEffects from './pages/StatusEffects';
import TeamPage from './pages/TeamPage';
import Teams from './pages/Teams';
import TierList from './pages/TierList';
import UsefulLinks from './pages/UsefulLinks';

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
      { label: 'Characters', path: '/characters' },
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
        label: 'Efficient Spending',
        path: '/guides/efficient-spending',
      },
      {
        label: 'Golden Clover Priority',
        path: '/guides/golden-clover-priority',
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

function Navigation({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation();
  return (
    <>
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          const isChildActive = item.children.some(
            (child) => location.pathname === child.path
          );
          return (
            <NavLink
              key={item.label}
              label={item.label}
              defaultOpened={isChildActive}
              childrenOffset={28}
              leftSection={item.icon && <item.icon />}
            >
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  component={Link}
                  to={child.path}
                  label={child.label}
                  active={location.pathname === child.path}
                  onClick={onNavigate}
                />
              ))}
            </NavLink>
          );
        }
        return (
          <NavLink
            key={item.path}
            component={Link}
            to={item.path!}
            label={item.label}
            leftSection={item.icon && <item.icon />}
            active={location.pathname === item.path}
            onClick={onNavigate}
          />
        );
      })}
    </>
  );
}

export default function App() {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <HashRouter>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 200,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
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
                <Title order={3} visibleFrom="sm">
                  Dragon Traveler Wiki
                </Title>
              </Link>
            </Group>
            <Group gap="xs">
              <SearchModal />
              <ThemeToggle />
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="xs">
          <Navigation onNavigate={close} />
        </AppShell.Navbar>

        <AppShell.Main
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Box style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/characters/:name" element={<CharacterPage />} />
              <Route path="/tier-list" element={<TierList />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:teamName" element={<TeamPage />} />
              <Route path="/status-effects" element={<StatusEffects />} />
              <Route path="/wyrmspells" element={<DragonSpells />} />
              <Route path="/codes" element={<Codes />} />
              <Route path="/useful-links" element={<UsefulLinks />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/guides/beginner-qa" element={<BeginnerQA />} />
              <Route
                path="/guides/star-upgrade-calculator"
                element={<StarUpgradeCalculator />}
              />
              <Route
                path="/guides/efficient-spending"
                element={<EfficientSpending />}
              />
              <Route
                path="/guides/golden-clover-priority"
                element={<GoldenCloverPriority />}
              />
            </Routes>
          </Box>
          <Footer />
        </AppShell.Main>
      </AppShell>
    </HashRouter>
  );
}
