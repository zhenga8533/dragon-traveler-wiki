/**
 * UI constants for consistent styling across the application
 */

// Character card sizes
export const CHARACTER_CARD = {
  PORTRAIT_SIZE: 80,
  BORDER_WIDTH: 3,
} as const;

// Character page hero
export const CHARACTER_HERO = {
  PORTRAIT_SIZE: 180,
  MIN_HEIGHT: 350,
  BORDER_WIDTH: 4,
  BLUR_AMOUNT: '20px',
  BRIGHTNESS: 0.4,
} as const;

// Image sizes
export const IMAGE_SIZE = {
  ICON_XS: 12,
  ICON_SM: 14,
  ICON_MD: 16,
  ICON_LG: 18,
  PORTRAIT_SM: 40,
} as const;

// Transitions
export const TRANSITION = {
  FAST: '150ms',
  NORMAL: '250ms',
  SLOW: '350ms',
  EASE: 'ease',
} as const;

// Z-index layers
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 100,
  STICKY: 200,
  /** Mobile bottom nav: above page content, below Mantine overlays (200) and modals/drawers (300) */
  BOTTOM_NAV: 150,
  FIXED: 300,
  MODAL_BACKDROP: 400,
  MODAL: 500,
  POPOVER: 600,
  TOOLTIP: 700,
} as const;

// Grid breakpoints for character lists
export const CHARACTER_GRID_COLS = {
  base: 2,
  xs: 3,
  sm: 4,
  md: 6,
} as const;

export const CHARACTER_GRID_SPACING = 12;

// Sidebar dimensions
export const SIDEBAR = {
  WIDTH_EXPANDED: 220,
  WIDTH_COLLAPSED: 70,
} as const;

export const HEADER_HEIGHT = {
  MOBILE: 64,
  DESKTOP: 72,
} as const;

/**
 * Visible height of the mobile bottom nav bar (icon + label + py="xs" padding).
 * Used for bottom spacers and positioning sticky UI elements (e.g. ScrollToTop).
 */
export const MOBILE_NAV_HEIGHT = 60;

// Storage keys
export const PAGE_SIZE = 50;

export const BREAKPOINTS = {
  COMPACT: '(max-width: 380px)',
  MOBILE: '(max-width: 768px)',
  XS: '(min-width: 36em)',
  DESKTOP: '(min-width: 48em)',
  MD: '(min-width: 62em)',
} as const;

/** WCAG minimum touch target height, also used as nav item height */
export const NAV_ITEM_HEIGHT = 44;

export const POPOVER_MAX_WIDTH = 320;

export const DETAIL_ROUTE_PATTERNS = [
  /^\/artifacts\/.+/,
  /^\/characters\/.+/,
  /^\/gear-sets\/.+/,
  /^\/noble-phantasms\/.+/,
  /^\/teams\/.+/,
];

export const STORAGE_KEY = {
  CHARACTER_VIEW_MODE: 'characters:viewMode',
  CHARACTER_FILTERS: 'characters:filters',
  CHARACTER_TIER_LIST_REFERENCE: 'characters:tierListReference',
  EVENT_VIEW_MODE: 'events:viewMode',
  EVENT_FILTERS: 'events:filters',
  STATUS_EFFECT_VIEW_MODE: 'status-effects:viewMode',
  STATUS_EFFECT_FILTERS: 'status-effects:filters',
  WYRMSPELL_VIEW_MODE: 'wyrmspells:viewMode',
  WYRMSPELL_FILTERS: 'wyrmspells:filters',
  NOBLE_PHANTASM_VIEW_MODE: 'noble-phantasms:viewMode',
  NOBLE_PHANTASM_FILTERS: 'noble-phantasms:filters',
  RESOURCE_VIEW_MODE: 'resources:viewMode',
  RESOURCE_FILTERS: 'resources:filters',
  SUBCLASS_VIEW_MODE: 'subclasses:viewMode',
  SUBCLASS_FILTERS: 'subclasses:filters',
  HOWLKIN_TAB: 'howlkins:tab',
  HOWLKIN_VIEW_MODE: 'howlkins:viewMode',
  HOWLKIN_FILTERS: 'howlkins:filters',
  TEAMS_VIEW_MODE: 'teams:viewMode',
  TEAMS_FILTERS: 'teams:filters',
  TEAMS_SEARCH: 'teams:search',
  TEAMS_BUILDER_DRAFT: 'teams:builderDraft',
  TIER_LIST_VIEW_MODE: 'tier-list:viewMode',
  TIER_LIST_SEARCH: 'tier-list:search',
  TIER_LIST_BUILDER_DRAFT: 'tier-list:builderDraft',
  CODES_VIEW_MODE: 'codes:viewMode',
  TIER_LIST_FILTERS: 'tier-list:filters',
  CODES_REWARDS_OPEN: 'codes:rewardsOpen',
  REDEEMED_CODES: 'redeemedCodes',
  ARTIFACT_VIEW_MODE: 'artifacts:viewMode',
  ARTIFACT_FILTERS: 'artifacts:filters',
  GEAR_VIEW_MODE: 'gear:viewMode',
  GEAR_TAB: 'gear:tab',
  GEAR_FILTERS: 'gear:filters',
  GEAR_SET_SEARCH: 'gear-sets:search',
  GOLDEN_ALLIANCE_SEARCH: 'golden-alliances:search',
  CHARACTER_SORT: 'characters:sort',
  RESOURCE_SORT: 'resources:sort',
  ARTIFACT_SORT: 'artifacts:sort',
  GEAR_SORT: 'gear:sort',
  HOWLKIN_SORT: 'howlkins:sort',
  WYRMSPELL_SORT: 'wyrmspells:sort',
  NOBLE_PHANTASM_SORT: 'noble-phantasms:sort',
  STATUS_EFFECT_SORT: 'status-effects:sort',
  SUBCLASS_SORT: 'subclasses:sort',
  SIDEBAR_COLLAPSED: 'sidebar:collapsed',
  TEAMS_BUILDER_SLOTS: 'teams:builderSlots',
  TIER_LIST_BUILDER_SLOTS: 'tier-list:builderSlots',
  TEAMS_MY_SAVED: 'teams:mySaved',
  TIER_LIST_MY_SAVED: 'tier-list:mySaved',
  HOME_BANNER: 'home:banner',
  HOME_BANNER_GLOBAL: 'home:bannerGlobal',
  HOME_BANNER_SLOW_SCROLL: 'home:bannerSlowScroll',
  GRADIENT_PALETTE: 'ui:gradientPalette',
  UI_BANNER_MEDIA_OPACITY: 'ui:bannerMediaOpacity',
  UI_BANNER_OVERLAY_OPACITY: 'ui:bannerOverlayOpacity',
  UI_SURFACE_OPACITY: 'ui:surfaceOpacity',
  CHANGELOG_TAB: 'changelog:tab',
} as const;
