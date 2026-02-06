import {
  ActionIcon,
  AppShell,
  Burger,
  Group,
  NavLink,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IoMoon, IoSunny } from 'react-icons/io5';
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import CharacterPage from './pages/CharacterPage';
import Characters from './pages/Characters';
import Codes from './pages/Codes';
import DragonSpells from './pages/DragonSpells';
import Home from './pages/Home';
import StatusEffects from './pages/StatusEffects';
import Teams from './pages/Teams';
import TierList from './pages/TierList';
import UsefulLinks from './pages/UsefulLinks';

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
      { label: 'Wyrmspells', path: '/wyrmspells' },
    ],
  },
  { label: 'Tier List', path: '/tier-list' },
  { label: 'Teams', path: '/teams' },
  { label: 'Codes', path: '/codes' },
  { label: 'Useful Links', path: '/useful-links' },
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
            <Route path="/characters/:name" element={<CharacterPage />} />
            <Route path="/tier-list" element={<TierList />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/status-effects" element={<StatusEffects />} />
            <Route path="/wyrmspells" element={<DragonSpells />} />
            <Route path="/dragon-spells" element={<DragonSpells />} />
            <Route path="/codes" element={<Codes />} />
            <Route path="/useful-links" element={<UsefulLinks />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </HashRouter>
  );
}
