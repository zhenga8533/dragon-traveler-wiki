import type { ComponentType } from 'react';
import { matchPath } from 'react-router-dom';
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

export type NavLeaf = { label: string; path: string };
export type NavGroup = {
  label: string;
  icon?: ComponentType;
  children: NavLeaf[];
};
export type NavItem = {
  label: string;
  path?: string;
  icon?: ComponentType;
  children?: (NavLeaf | NavGroup)[];
};

export function isNavGroup(child: NavLeaf | NavGroup): child is NavGroup {
  return 'children' in child;
}

export const NAV_ITEMS: NavItem[] = [
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

const NAV_ACTIVE_PATTERNS: Record<string, string[]> = {
  '/gear': ['/gear', '/gear-sets/:setName'],
  '/relics': ['/relics', '/oracle-scrolls/:scrollName'],
};

export function isNavPathActive(navPath: string, pathname: string) {
  const patterns = NAV_ACTIVE_PATTERNS[navPath] ?? [navPath, `${navPath}/*`];
  return patterns.some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) !== null,
  );
}

export function groupHasActiveChild(group: NavGroup, pathname: string) {
  return group.children.some((leaf) => isNavPathActive(leaf.path, pathname));
}

export function childIsActive(child: NavLeaf | NavGroup, pathname: string) {
  return isNavGroup(child)
    ? groupHasActiveChild(child, pathname)
    : isNavPathActive(child.path, pathname);
}

/** Labels (or `Parent>Child` compound keys) of nav groups/subgroups that contain the active route. */
export function getActiveGroupKeys(pathname: string) {
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
