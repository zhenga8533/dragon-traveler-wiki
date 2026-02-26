import { Badge, Group, NavLink, Tooltip } from '@mantine/core';
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
} from 'react';
import {
  IoBook,
  IoGift,
  IoHome,
  IoLink,
  IoList,
  IoServer,
  IoShield,
  IoTrophy,
} from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';
import { getAccentForPath, PARENT_ACCENTS } from '../../constants/accents';
import { NAV_ITEM_HEIGHT, STORAGE_KEY } from '../../constants/ui';
import { SearchDataContext } from '../../contexts';
import { isCodeActive } from '../../utils';

type NavItem = {
  label: string;
  path?: string;
  icon?: ComponentType;
  children?: { label: string; path: string; icon?: ComponentType }[];
};

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
      { label: 'Resources', path: '/resources' },
      { label: 'Subclasses', path: '/subclasses' },
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
        label: 'Mythic Summon Calculator',
        path: '/guides/mythic-summon-calculator',
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
  Icon: ComponentType<{ size?: number; style?: CSSProperties }>,
  accent: string,
  isActive: boolean
) => <Icon size={18} style={{ color: getIconColor(accent, isActive) }} />;

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
  const { codes } = useContext(SearchDataContext);

  const loadRedeemedCodes = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY.REDEEMED_CODES);
      if (raw) return new Set<string>(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return new Set<string>();
  };

  const [redeemedCodes, setRedeemedCodes] = useState<Set<string>>(() =>
    loadRedeemedCodes()
  );

  useEffect(() => {
    const syncRedeemedCodes = () => {
      setRedeemedCodes(loadRedeemedCodes());
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
        (code) => isCodeActive(code) && !redeemedCodes.has(code.code)
      ).length,
    [codes, redeemedCodes]
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of NAV_ITEMS) {
      if (item.children) {
        const active = item.children.some((c) => location.pathname === c.path);
        if (active) initial[item.label] = true;
      }
    }
    return initial;
  });

  useEffect(() => {
    for (const item of NAV_ITEMS) {
      if (item.children) {
        const active = item.children.some((c) => location.pathname === c.path);
        if (active) {
          setOpenGroups((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    }
  }, [location.pathname]);

  return (
    <>
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          const isChildActive = item.children.some(
            (child) => location.pathname === child.path
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
          const tooltipLabel =
            item.label === 'Codes' && activeCodesCount > 0
              ? `${item.label} (${activeCodesCount})`
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
              <Badge size="xs" variant="light" color="violet" radius="sm">
                {activeCodesCount}
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
