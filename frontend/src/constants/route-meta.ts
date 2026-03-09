export type RouteMeta = {
  title: string;
  description: string;
};

export type RouteMetaEntry = {
  pattern: string;
  meta: RouteMeta;
};

export const SITE_NAME = 'Dragon Traveler Wiki';
export const DEFAULT_DESCRIPTION =
  'A comprehensive wiki for Dragon Traveler game information, characters, resources, and more.';
export const BASE_URL = 'https://dtwiki.org';
export const DEFAULT_IMAGE = `${BASE_URL}/banner.png`;

export const ROUTE_META: RouteMetaEntry[] = [
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
        'Browse Howlkins and Golden Alliances with passive abilities, alliance bonuses, and stat progression by membership level.',
    },
  },
  {
    pattern: '/noble-phantasms',
    meta: {
      title: 'Noble Phantasms',
      description:
        'Browse Noble Phantasms with skill counts, lore previews, global availability, and links to their characters.',
    },
  },
  {
    pattern: '/noble-phantasms/:name',
    meta: {
      title: 'Noble Phantasm Details',
      description:
        'Noble Phantasm deep dive with tier-based effect tables, skill progression by level, and character attribution.',
    },
  },
  {
    pattern: '/resources',
    meta: {
      title: 'Resources',
      description:
        "Search and filter game resources by category and quality, with descriptions covering each item's purpose and use.",
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
        'Browse Wyrmspells with quality, type, faction exclusivity, global availability, and max-quality effect descriptions.',
    },
  },
  {
    pattern: '/tier-list',
    meta: {
      title: 'Tier List',
      description:
        'View and build tier lists with content-type rankings, filterable character grids, and upgrade priority context.',
    },
  },
  {
    pattern: '/teams',
    meta: {
      title: 'Teams',
      description:
        'Browse and build teams with faction and content-type filters, synergy scoring, and character roster details.',
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
    pattern: '/events',
    meta: {
      title: 'Events',
      description:
        'Browse active and past in-game events for Dragon Traveler, automatically synced from the App Store.',
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
        'Translated beginner guide covering summoning priorities, diamond spending, progression mechanics, events, guild tips, and affection gifts.',
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
    pattern: '/guides/diamond-calculator',
    meta: {
      title: 'Diamond Calculator',
      description:
        'Estimate recurring diamond gain and spend, forecast run-out timing, and project your balance by date.',
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
