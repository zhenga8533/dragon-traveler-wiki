import { useEffect, useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

type RouteMeta = {
  title: string;
  description: string;
};

const SITE_NAME = 'Dragon Traveler Wiki';
const DEFAULT_DESCRIPTION =
  'A comprehensive wiki for Dragon Traveler game information, characters, resources, and more.';
const BASE_URL = 'https://dtwiki.org';
const DEFAULT_IMAGE = `${BASE_URL}/banner.png`;

const KNOWN_ROUTE_PATTERNS = [
  '/',
  '/artifacts',
  '/artifacts/:name',
  '/characters',
  '/characters/:name',
  '/gear',
  '/gear-sets/:setName',
  '/howlkins',
  '/noble-phantasms',
  '/noble-phantasms/:name',
  '/resources',
  '/subclasses',
  '/status-effects',
  '/wyrmspells',
  '/tier-list',
  '/teams',
  '/teams/:teamName',
  '/codes',
  '/useful-links',
  '/changelog',
  '/guides/faq',
  '/guides/beginner-qa',
  '/guides/star-upgrade-calculator',
  '/guides/mythic-summon-calculator',
  '/guides/shovel-event',
] as const;

const ROUTE_META: Array<{ pattern: string; meta: RouteMeta }> = [
  {
    pattern: '/',
    meta: {
      title: 'Home',
      description:
        'Your Dragon Traveler hub for character builds, database lookups, progression guides, calculators, and event tools.',
    },
  },
  {
    pattern: '/artifacts',
    meta: {
      title: 'Artifacts',
      description:
        'Browse artifact data with level effects, quality, lore, and synergy notes for optimized build planning.',
    },
  },
  {
    pattern: '/artifacts/:name',
    meta: {
      title: 'Artifact Details',
      description:
        'Full artifact breakdown including level-by-level effects, treasure interactions, and recommended use cases.',
    },
  },
  {
    pattern: '/characters',
    meta: {
      title: 'Characters',
      description:
        'Explore characters with class, faction, quality, and build context for PvE progression and team synergy.',
    },
  },
  {
    pattern: '/characters/:name',
    meta: {
      title: 'Character Details',
      description:
        'Detailed character page with kit analysis, recommended gear/artifacts, team role, and progression tips.',
    },
  },
  {
    pattern: '/gear',
    meta: {
      title: 'Gear',
      description:
        'Review gear pieces and sets with set-bonus effects and filtering tools for faster optimization.',
    },
  },
  {
    pattern: '/gear-sets/:setName',
    meta: {
      title: 'Gear Set Details',
      description:
        'See complete set bonus details, ideal users, and practical build paths for each gear set.',
    },
  },
  {
    pattern: '/howlkins',
    meta: {
      title: 'Howlkins',
      description:
        'Compare Howlkins and Golden Alliances with ability context and lineup recommendations.',
    },
  },
  {
    pattern: '/noble-phantasms',
    meta: {
      title: 'Noble Phantasms',
      description:
        'Browse Noble Phantasms with effects, skill notes, and role-fit recommendations by content type.',
    },
  },
  {
    pattern: '/noble-phantasms/:name',
    meta: {
      title: 'Noble Phantasm Details',
      description:
        'Noble Phantasm deep dive with effects, skill tables, and best-fit character considerations.',
    },
  },
  {
    pattern: '/resources',
    meta: {
      title: 'Resources',
      description:
        'Track resource types with sources and practical progression priorities to accelerate account growth.',
    },
  },
  {
    pattern: '/subclasses',
    meta: {
      title: 'Subclasses',
      description:
        'Compare subclasses with effects and role fit to choose stronger class enhancements.',
    },
  },
  {
    pattern: '/status-effects',
    meta: {
      title: 'Status Effects',
      description:
        'Reference status effects to understand buffs, debuffs, and tactical combat interactions.',
    },
  },
  {
    pattern: '/wyrmspells',
    meta: {
      title: 'Wyrmspells',
      description:
        'Browse Wyrmspells with effect details and pairing ideas for strong PvE performance.',
    },
  },
  {
    pattern: '/tier-list',
    meta: {
      title: 'Tier List',
      description:
        'View curated tier lists with role-based rankings and context to guide your upgrade priorities.',
    },
  },
  {
    pattern: '/teams',
    meta: {
      title: 'Teams',
      description:
        'Explore curated teams with composition goals, synergy notes, and progression-focused alternatives.',
    },
  },
  {
    pattern: '/teams/:teamName',
    meta: {
      title: 'Team Details',
      description:
        'Detailed team page covering member roles, substitutes, faction context, and practical usage tips.',
    },
  },
  {
    pattern: '/codes',
    meta: {
      title: 'Codes',
      description:
        'Find redeem codes with active status tracking and quick reward-claim reference.',
    },
  },
  {
    pattern: '/useful-links',
    meta: {
      title: 'Useful Links',
      description:
        'Access curated official and community links for tools, channels, and external references.',
    },
  },
  {
    pattern: '/changelog',
    meta: {
      title: 'Changelog',
      description:
        'Track documented wiki updates, including data refreshes and feature improvements.',
    },
  },
  {
    pattern: '/guides/faq',
    meta: {
      title: 'FAQ',
      description:
        'Frequently asked questions covering wiki usage, beginner priorities, and practical progression guidance.',
    },
  },
  {
    pattern: '/guides/beginner-qa',
    meta: {
      title: 'Beginner Q&A Guide',
      description:
        'Beginner-first FAQ with practical advice for early progression, spending priorities, and common mistakes.',
    },
  },
  {
    pattern: '/guides/star-upgrade-calculator',
    meta: {
      title: 'Star Upgrade Calculator',
      description:
        'Plan star upgrades by calculating copy and shard requirements before you invest resources.',
    },
  },
  {
    pattern: '/guides/mythic-summon-calculator',
    meta: {
      title: 'Mythic Summon Calculator',
      description:
        'Estimate Mythic Summon outcomes and required pulls to budget resources with confidence.',
    },
  },
  {
    pattern: '/guides/shovel-event',
    meta: {
      title: 'Shovel Event Guide',
      description:
        'Optimize Shovel Event progression with milestone planning, route choices, and reward efficiency tips.',
    },
  },
  {
    pattern: '*',
    meta: {
      title: 'Page Not Found',
      description:
        'The requested page could not be found. Explore the Dragon Traveler Wiki from the homepage.',
    },
  },
];

function upsertMetaTag(
  attr: 'name' | 'property',
  key: string,
  content: string
): void {
  const selector = `meta[${attr}="${key}"]`;
  let meta = document.querySelector<HTMLMetaElement>(selector);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

function getRouteMeta(pathname: string): RouteMeta {
  const explicit = ROUTE_META.find(
    ({ pattern }) =>
      pattern !== '*' &&
      matchPath({ path: pattern, end: true }, pathname) !== null
  );

  if (explicit) {
    return explicit.meta;
  }

  const isKnownPage = KNOWN_ROUTE_PATTERNS.some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) !== null
  );

  if (isKnownPage) {
    return {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    };
  }

  const notFound = ROUTE_META.find(({ pattern }) => pattern === '*');

  return (
    notFound?.meta ?? {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    }
  );
}

export default function RouteMeta() {
  const { pathname } = useLocation();

  const routeMeta = useMemo(() => getRouteMeta(pathname), [pathname]);

  useEffect(() => {
    const pageTitle =
      routeMeta.title === SITE_NAME
        ? SITE_NAME
        : `${routeMeta.title} | ${SITE_NAME}`;
    const hashPath = pathname === '/' ? '/' : pathname;
    const pageUrl = `${BASE_URL}/#${hashPath}`;

    document.title = pageTitle;
    upsertMetaTag('name', 'description', routeMeta.description);

    upsertMetaTag('property', 'og:title', pageTitle);
    upsertMetaTag('property', 'og:description', routeMeta.description);
    upsertMetaTag('property', 'og:url', pageUrl);
    upsertMetaTag('property', 'og:type', 'website');
    upsertMetaTag('property', 'og:image', DEFAULT_IMAGE);

    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', pageTitle);
    upsertMetaTag('name', 'twitter:description', routeMeta.description);
    upsertMetaTag('name', 'twitter:image', DEFAULT_IMAGE);
  }, [pathname, routeMeta]);

  return null;
}
