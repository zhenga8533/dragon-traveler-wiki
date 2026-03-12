import SearchModal from '@/components/tools/SearchModal';
import { getGlassStyles } from '@/constants/glass';
import { Z_INDEX } from '@/constants/ui';
import { UiOpacityContext } from '@/contexts';
import { useDarkMode, useGradientAccent } from '@/hooks';
import { Box, Group, Stack, Text } from '@mantine/core';
import { useContext } from 'react';
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
  const { surfaceOpacity } = useContext(UiOpacityContext);
  const glassStyles = getGlassStyles(isDark, false, surfaceOpacity);

  return (
    <Box
      hiddenFrom="sm"
      component="nav"
      aria-label="Quick navigation"
      style={{
        position: 'fixed',
        // -1px overhangs the viewport by 1px, eliminating any subpixel sliver
        // between the nav background and the screen edge.
        bottom: '-1px',
        left: 0,
        right: 0,
        // Below Mantine overlay (200) and modal/drawer panels (300) so they
        // always render on top of the nav when open.
        zIndex: Z_INDEX.BOTTOM_NAV,
        ...glassStyles,
        border: 'none',
        borderTop: glassStyles.border,
        // +1px compensates for the -1px bottom offset so items aren't clipped.
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1px)',
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
