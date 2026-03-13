import SearchModal from '@/components/tools/SearchModal';
import { getGlassStyles } from '@/constants/glass';
import { Z_INDEX } from '@/constants/ui';
import { useDarkMode, useGradientAccent } from '@/hooks';
import { Box, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IoCalendar,
  IoGift,
  IoHome,
  IoPeople,
  IoSearch,
} from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';

const BOTTOM_NAV_ITEMS = [
  { label: 'Home', path: '/', icon: IoHome, exact: true },
  { label: 'Characters', path: '/characters', icon: IoPeople, exact: false },
  { label: 'Events', path: '/events', icon: IoCalendar, exact: false },
  { label: 'Codes', path: '/codes', icon: IoGift, exact: false },
] as const;

export default function MobileBottomNav() {
  const location = useLocation();
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();
  const glassStyles = getGlassStyles(isDark);
  const isLandscape = useMediaQuery('(orientation: landscape)');

  if (isLandscape) return null;

  return (
    <Box
      hiddenFrom="sm"
      component="nav"
      aria-label="Quick navigation"
      style={{
        position: 'fixed',
        // Extend 100px below the viewport so the background fills any gap the
        // mobile browser creates when its toolbar collapses/expands on scroll.
        bottom: '-100px',
        left: 0,
        right: 0,
        zIndex: Z_INDEX.BOTTOM_NAV,
        ...glassStyles,
        border: 'none',
        borderTop: glassStyles.border,
        // Extra 100px compensates for the -100px bottom offset.
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
      }}
    >
      <Group justify="space-around" gap={0} py="xs" px="sm" wrap="nowrap">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          const activeColor = `var(--mantine-color-${accent.primary}-6)`;
          const dimmedColor = 'var(--mantine-color-dimmed)';

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                padding: '4px 0',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Stack gap={2} align="center">
                <Icon
                  size={22}
                  style={{
                    color: isActive ? activeColor : dimmedColor,
                    transition: 'color 150ms ease',
                  }}
                />
                <Text
                  size="xs"
                  fw={isActive ? 600 : 400}
                  style={{
                    color: isActive ? activeColor : dimmedColor,
                    transition: 'color 150ms ease',
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </Text>
              </Stack>
            </Link>
          );
        })}

        <SearchModal
          enableHotkeys={false}
          trigger={({ open }) => (
            <button
              onClick={open}
              aria-label="Open search"
              style={{
                flex: 1,
                padding: '4px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Stack gap={2} align="center">
                <IoSearch
                  size={22}
                  style={{ color: 'var(--mantine-color-dimmed)' }}
                />
                <Text
                  size="xs"
                  style={{
                    color: 'var(--mantine-color-dimmed)',
                    lineHeight: 1.2,
                  }}
                >
                  Search
                </Text>
              </Stack>
            </button>
          )}
        />
      </Group>
    </Box>
  );
}
