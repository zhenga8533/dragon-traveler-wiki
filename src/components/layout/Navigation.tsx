import { getAccentForPath, PARENT_ACCENTS } from '@/constants/accents';
import { IMAGE_SIZE, NAV_ITEM_HEIGHT, STORAGE_KEY } from '@/constants/ui';
import { SearchDataContext } from '@/contexts';
import { isCodeActive, readStoredStringSet } from '@/utils';
import { isGameEventActive } from '@/utils/event-utils';
import { Badge, Group, NavLink, Tooltip } from '@mantine/core';
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from 'react';
import {
  IoBook,
  IoCalculatorOutline,
  IoCalendar,
  IoConstructOutline,
  IoEllipsisHorizontalOutline,
  IoGift,
  IoHome,
  IoList,
  IoServer,
  IoShield,
  IoTrophy,
} from 'react-icons/io5';
import { Link, matchPath, useLocation } from 'react-router-dom';

type NavLeaf = { label: string; path: string };
type NavGroup = {
  label: string;
  icon?: ComponentType;
  children: NavLeaf[];
};
type NavItem = {
  label: string;
  path?: string;
  icon?: ComponentType;
  children?: (NavLeaf | NavGroup)[];
};

function isNavGroup(child: NavLeaf | NavGroup): child is NavGroup {
  return 'children' in child;
}

function groupHasActiveChild(group: NavGroup, pathname: string) {
  return group.children.some((leaf) => isNavPathActive(leaf.path, pathname));
}

function childIsActive(child: NavLeaf | NavGroup, pathname: string) {
  return isNavGroup(child)
    ? groupHasActiveChild(child, pathname)
    : isNavPathActive(child.path, pathname);
}

function getActiveGroupKeys(pathname: string) {
  const keys: string[] = [];
  for (const item of NAV_ITEMS) {
    if (!item.children) continue;
    if (item.children.some((child) => childIsActive(child, pathname))) {
      keys.push(item.label);
    }
    for (const child of item.children) {
      if (isNavGroup(child) && groupHasActiveChild(child, pathname)) {
        keys.push(`${item.label}>${child.label}`);
      }
    }
  }
  return keys;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', icon: IoHome },
  {
    label: 'Database',
    icon: IoServer,
    children: [
      { label: 'Artifacts', path: '/artifacts' },
      { label: 'Characters', path: '/characters' },
      { label: 'Gear', path: '/gear' },
      { label: 'Howlkins', path: '/howlkins' },
      { label: 'Noble Phantasms', path: '/noble-phantasms' },
      { label: 'Relics', path: '/relics' },
      { label: 'Resources', path: '/resources' },
      { label: 'Subclasses', path: '/subclasses' },
      { label: 'Status Effects', path: '/status-effects' },
      { label: 'Wyrms', path: '/wyrms' },
      { label: 'Wyrmspells', path: '/wyrmspells' },
    ],
  },
  {
    label: 'Toolbox',
    icon: IoConstructOutline,
    children: [
      {
        label: 'Calculators',
        icon: IoCalculatorOutline,
        children: [
          {
            label: 'Star Upgrade Calculator',
            path: '/toolbox/star-upgrade-calculator',
          },
          {
            label: 'Mythic Summon Calculator',
            path: '/toolbox/mythic-summon-calculator',
          },
          {
            label: 'Diamond Calculator',
            path: '/toolbox/diamond-calculator',
          },
        ],
      },
      {
        label: 'Strategy Guides',
        icon: IoBook,
        children: [
          { label: 'Beginner Q&A', path: '/toolbox/beginner-qa' },
          { label: 'Shovel Event Guide', path: '/toolbox/shovel-event' },
        ],
      },
      {
        label: 'Misc',
        icon: IoEllipsisHorizontalOutline,
        children: [
          { label: 'FAQ', path: '/toolbox/faq' },
          { label: 'Useful Links', path: '/toolbox/useful-links' },
          { label: 'DTdle', path: '/toolbox/dtdle' },
        ],
      },
    ],
  },
  { label: 'Tier List', path: '/tier-list', icon: IoTrophy },
  { label: 'Teams', path: '/teams', icon: IoShield },
  { label: 'Events', path: '/events', icon: IoCalendar },
  { label: 'Codes', path: '/codes', icon: IoGift },
  { label: 'Changelog', path: '/changelog', icon: IoList },
];

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

const NAV_ACTIVE_PATTERNS: Record<string, string[]> = {
  '/gear': ['/gear', '/gear-sets/:setName'],
  '/relics': ['/relics', '/oracle-scrolls/:scrollName'],
};

function isNavPathActive(navPath: string, pathname: string) {
  const patterns = NAV_ACTIVE_PATTERNS[navPath] ?? [navPath, `${navPath}/*`];
  return patterns.some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) !== null,
  );
}

const renderNavIcon = (
  Icon: ComponentType<{ size?: number; color?: string }>,
  accent: string,
  isActive: boolean,
) => <Icon size={IMAGE_SIZE.ICON_LG} color={getIconColor(accent, isActive)} />;

export default function Navigation({
  onNavigate,
  showLabels,
  onExpand,
}: {
  onNavigate: () => void;
  showLabels: boolean;
  onExpand?: () => void;
}) {
  const location = useLocation();
  const { codes, events } = useContext(SearchDataContext);

  const [redeemedCodes, setRedeemedCodes] = useState<Set<string>>(() =>
    readStoredStringSet(STORAGE_KEY.REDEEMED_CODES),
  );

  useEffect(() => {
    const syncRedeemedCodes = () => {
      setRedeemedCodes(readStoredStringSet(STORAGE_KEY.REDEEMED_CODES));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY.REDEEMED_CODES) {
        syncRedeemedCodes();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('redeemed-codes-updated', syncRedeemedCodes);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('redeemed-codes-updated', syncRedeemedCodes);
    };
  }, []);

  const activeCodesCount = useMemo(
    () =>
      codes.filter(
        (code) => isCodeActive(code) && !redeemedCodes.has(code.code),
      ).length,
    [codes, redeemedCodes],
  );

  const activeEventsCount = useMemo(
    () => events.filter((event) => isGameEventActive(event)).length,
    [events],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const key of getActiveGroupKeys(location.pathname)) {
      initial[key] = true;
    }
    return initial;
  });

  useEffect(() => {
    const labelsToOpen = getActiveGroupKeys(location.pathname);

    if (labelsToOpen.length > 0) {
      queueMicrotask(() => {
        setOpenGroups((prev) => {
          const next = { ...prev };
          for (const label of labelsToOpen) {
            next[label] = true;
          }
          return next;
        });
      });
    }
  }, [location.pathname]);

  return (
    <>
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          const isChildActive = item.children.some((child) =>
            childIsActive(child, location.pathname),
          );
          const parentAccent = PARENT_ACCENTS[item.label];

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
                  aria-label={`${item.label} navigation group`}
                  title={item.label}
                  leftSection={
                    item.icon &&
                    renderNavIcon(item.icon, parentAccent, isChildActive)
                  }
                  active={isChildActive}
                  color={parentAccent}
                  styles={collapsedNavStyles}
                  onClick={() => {
                    setOpenGroups((prev) => ({ ...prev, [item.label]: true }));
                    onExpand?.();
                  }}
                />
              </Tooltip>
            );
          }

          return (
            <NavLink
              key={item.label}
              label={item.label}
              opened={openGroups[item.label] ?? false}
              onChange={(opened) =>
                setOpenGroups((prev) => ({ ...prev, [item.label]: opened }))
              }
              childrenOffset={28}
              leftSection={
                item.icon &&
                renderNavIcon(item.icon, parentAccent, isChildActive)
              }
              color={parentAccent}
              styles={expandedNavStyles}
            >
              {item.children.map((child) => {
                if (isNavGroup(child)) {
                  const groupKey = `${item.label}>${child.label}`;
                  const isSubgroupActive = groupHasActiveChild(
                    child,
                    location.pathname,
                  );
                  return (
                    <NavLink
                      key={child.label}
                      label={child.label}
                      opened={openGroups[groupKey] ?? false}
                      onChange={(opened) =>
                        setOpenGroups((prev) => ({
                          ...prev,
                          [groupKey]: opened,
                        }))
                      }
                      childrenOffset={16}
                      leftSection={
                        child.icon &&
                        renderNavIcon(
                          child.icon,
                          parentAccent,
                          isSubgroupActive,
                        )
                      }
                      active={isSubgroupActive}
                      color={parentAccent}
                    >
                      {child.children.map((leaf) => {
                        const leafAccent = getAccentForPath(leaf.path);
                        return (
                          <NavLink
                            key={leaf.path}
                            component={Link}
                            to={leaf.path}
                            label={leaf.label}
                            active={isNavPathActive(
                              leaf.path,
                              location.pathname,
                            )}
                            color={leafAccent}
                            onClick={onNavigate}
                          />
                        );
                      })}
                    </NavLink>
                  );
                }

                const childAccent = getAccentForPath(child.path);
                return (
                  <NavLink
                    key={child.path}
                    component={Link}
                    to={child.path}
                    label={child.label}
                    active={isNavPathActive(child.path, location.pathname)}
                    color={childAccent}
                    onClick={onNavigate}
                  />
                );
              })}
            </NavLink>
          );
        }

        const itemAccent = getAccentForPath(item.path!);
        const isActive = isNavPathActive(item.path!, location.pathname);

        if (!showLabels) {
          const tooltipLabel =
            item.label === 'Codes' && activeCodesCount > 0
              ? `${item.label} (${activeCodesCount})`
              : item.label === 'Events' && activeEventsCount > 0
                ? `${item.label} (${activeEventsCount})`
                : item.label;
          return (
            <Tooltip
              key={item.path}
              label={tooltipLabel}
              position="right"
              withArrow
            >
              <NavLink
                component={Link}
                to={item.path!}
                label=""
                aria-label={tooltipLabel}
                title={item.label}
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

        const label =
          item.label === 'Codes' && activeCodesCount > 0 ? (
            <Group gap={6} wrap="nowrap">
              <span>{item.label}</span>
              <Badge size="xs" variant="light" color="yellow" radius="sm">
                {activeCodesCount}
              </Badge>
            </Group>
          ) : item.label === 'Events' && activeEventsCount > 0 ? (
            <Group gap={6} wrap="nowrap">
              <span>{item.label}</span>
              <Badge size="xs" variant="light" color="green" radius="sm">
                {activeEventsCount}
              </Badge>
            </Group>
          ) : (
            item.label
          );

        return (
          <NavLink
            key={item.path}
            component={Link}
            to={item.path!}
            label={label}
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
