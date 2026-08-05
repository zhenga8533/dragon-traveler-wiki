import {
  childIsActive,
  isNavGroup,
  isNavPathActive,
  NAV_ITEMS,
  type NavItem,
  type NavLeaf,
} from '@/constants/nav-items';
import { IMAGE_SIZE } from '@/constants/ui';
import { useGradientAccent, useNavBadgeCounts } from '@/hooks';
import {
  Badge,
  Box,
  Group,
  Menu,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import type { ComponentType } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import { Link, useLocation } from 'react-router';

const getIconColor = (accent: string, isActive: boolean) =>
  `var(--mantine-color-${accent}-${isActive ? '6' : '5'})`;

function NavIcon({
  icon: Icon,
  accent,
  isActive,
}: {
  icon?: ComponentType<{ size?: number; color?: string }>;
  accent: string;
  isActive: boolean;
}) {
  if (!Icon) return null;
  return (
    <Box component="span" visibleFrom="xl">
      <Icon size={IMAGE_SIZE.ICON_MD} color={getIconColor(accent, isActive)} />
    </Box>
  );
}

/** Shared look for both plain links and group triggers in the horizontal header nav.
 * Items stretch to the header's full height so the active underline sits flush
 * against the header's bottom edge, like a tab indicator, instead of floating
 * mid-row as a rounded box border. */
function headerNavItemStyle(isActive: boolean, accent: string) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: '100%',
    padding: '0 var(--mantine-spacing-sm)',
    borderBottom: `3px solid ${
      isActive ? `var(--mantine-color-${accent}-6)` : 'transparent'
    }`,
    color: isActive
      ? `var(--mantine-color-${accent}-6)`
      : 'var(--mantine-color-text)',
    fontWeight: isActive ? 600 : 500,
    fontSize: 'var(--mantine-font-size-sm)',
    whiteSpace: 'nowrap' as const,
  };
}

function LeafMenuItem({ leaf }: { leaf: NavLeaf }) {
  return (
    <Menu.Item key={leaf.path} component={Link} to={leaf.path}>
      {leaf.label}
    </Menu.Item>
  );
}

/** Dropdown body for a nav group: a flat leaf grid (e.g. Database), or one
 * column per subgroup with its own heading + leaf list (e.g. Toolbox). */
function MegaMenu({ group }: { group: NavItem }) {
  const children = group.children ?? [];
  const flatLeaves = children.filter(
    (child): child is NavLeaf => !isNavGroup(child),
  );

  if (flatLeaves.length === children.length) {
    return (
      <SimpleGrid cols={2} spacing={4} style={{ width: 380 }}>
        {flatLeaves.map((leaf) => (
          <LeafMenuItem key={leaf.path} leaf={leaf} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={children.length} spacing="lg" style={{ width: 460 }}>
      {children.map((child) =>
        isNavGroup(child) ? (
          <Stack key={child.label} gap={2}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" px={8}>
              {child.label}
            </Text>
            {child.children.map((leaf) => (
              <LeafMenuItem key={leaf.path} leaf={leaf} />
            ))}
          </Stack>
        ) : (
          <LeafMenuItem key={child.path} leaf={child} />
        ),
      )}
    </SimpleGrid>
  );
}

export default function HeaderNav() {
  const location = useLocation();
  const { accent } = useGradientAccent();
  const navAccent = accent.primary;
  const { activeCodesCount, activeEventsCount } = useNavBadgeCounts();

  return (
    <Group h="100%" gap={4} wrap="nowrap" align="stretch">
      {NAV_ITEMS.filter((item) => item.label !== 'Home').map((item) => {
        if (item.children) {
          const isChildActive = item.children.some((child) =>
            childIsActive(child, location.pathname),
          );

          return (
            <Menu
              key={item.label}
              trigger="hover"
              openDelay={80}
              closeDelay={150}
              position="bottom-start"
              offset={4}
              withinPortal
              shadow="md"
            >
              <Menu.Target>
                <UnstyledButton
                  style={headerNavItemStyle(isChildActive, navAccent)}
                >
                  <NavIcon
                    icon={item.icon}
                    accent={navAccent}
                    isActive={isChildActive}
                  />
                  <span>{item.label}</span>
                  <IoChevronDown size={IMAGE_SIZE.ICON_SM} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown p="sm">
                <MegaMenu group={item} />
              </Menu.Dropdown>
            </Menu>
          );
        }

        const isActive = isNavPathActive(item.path!, location.pathname);
        const badgeCount =
          item.label === 'Codes'
            ? activeCodesCount
            : item.label === 'Events'
              ? activeEventsCount
              : 0;
        const badgeColor = item.label === 'Codes' ? 'yellow' : 'green';

        return (
          <UnstyledButton
            key={item.path}
            component={Link}
            to={item.path!}
            style={headerNavItemStyle(isActive, navAccent)}
          >
            <NavIcon icon={item.icon} accent={navAccent} isActive={isActive} />
            <span>{item.label}</span>
            {badgeCount > 0 && (
              <Badge size="xs" variant="light" color={badgeColor} radius="sm">
                {badgeCount}
              </Badge>
            )}
          </UnstyledButton>
        );
      })}
    </Group>
  );
}
