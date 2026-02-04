import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Title,
  NavLink,
  ActionIcon,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IoSunny, IoMoon } from 'react-icons/io5';
import Home from './pages/Home';
import Characters from './pages/Characters';
import TierList from './pages/TierList';
import Teams from './pages/Teams';
import Effects from './pages/Effects';
import DragonSpells from './pages/DragonSpells';
import Codes from './pages/Codes';
import UsefulLinks from './pages/UsefulLinks';
import News from './pages/News';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Characters', path: '/characters' },
  { label: 'Tier List', path: '/tier-list' },
  { label: 'Teams', path: '/teams' },
  { label: 'Effects', path: '/effects' },
  { label: 'Dragon Spells', path: '/dragon-spells' },
  { label: 'Codes', path: '/codes' },
  { label: 'Useful Links', path: '/useful-links' },
  { label: 'News', path: '/news' },
];

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={toggleColorScheme}
      aria-label="Toggle color scheme"
    >
      {colorScheme === 'dark' ? <IoSunny /> : <IoMoon />}
    </ActionIcon>
  );
}

function Navigation({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation();
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          component={Link}
          to={item.path}
          label={item.label}
          active={location.pathname === item.path}
          onClick={onNavigate}
        />
      ))}
    </>
  );
}

export default function App() {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <HashRouter>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Title order={3}>Dragon Traveler Wiki</Title>
            </Group>
            <ThemeToggle />
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="xs">
          <Navigation onNavigate={close} />
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/tier-list" element={<TierList />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/effects" element={<Effects />} />
            <Route path="/dragon-spells" element={<DragonSpells />} />
            <Route path="/codes" element={<Codes />} />
            <Route path="/useful-links" element={<UsefulLinks />} />
            <Route path="/news" element={<News />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </HashRouter>
  );
}
