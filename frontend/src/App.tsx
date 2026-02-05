import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Title,
  NavLink,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IoSunny, IoMoon } from 'react-icons/io5';
import Home from './pages/Home';
import Characters from './pages/Characters';
import TierList from './pages/TierList';
import Teams from './pages/Teams';
import StatusEffects from './pages/StatusEffects';
import DragonSpells from './pages/DragonSpells';
import Codes from './pages/Codes';
import UsefulLinks from './pages/UsefulLinks';
import News from './pages/News';

type NavItem = {
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  {
    label: 'Database',
    children: [
      { label: 'Characters', path: '/characters' },
      { label: 'Status Effects', path: '/status-effects' },
      { label: 'Dragon Spells', path: '/dragon-spells' },
    ],
  },
  { label: 'Tier List', path: '/tier-list' },
  { label: 'Teams', path: '/teams' },
  { label: 'Codes', path: '/codes' },
  { label: 'Useful Links', path: '/useful-links' },
  { label: 'News', path: '/news' },
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
            <Route path="/status-effects" element={<StatusEffects />} />
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
