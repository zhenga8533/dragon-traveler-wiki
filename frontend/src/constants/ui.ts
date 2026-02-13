/**
 * UI constants for consistent styling across the application
 */

// Character card sizes
export const CHARACTER_CARD = {
  PORTRAIT_SIZE: 80,
  BORDER_WIDTH: 3,
  TRANSITION_DURATION: '150ms',
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
  ICON_SM: 14,
  ICON_MD: 16,
  ICON_LG: 20,
  ICON_XL: 24,
  PORTRAIT_SM: 40,
  PORTRAIT_MD: 80,
  PORTRAIT_LG: 180,
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

// Storage keys
export const STORAGE_KEY = {
  CHARACTER_VIEW_MODE: 'characters:viewMode',
  CHARACTER_FILTERS: 'characters:filters',
  CHARACTER_TIER_LIST_REFERENCE: 'characters:tierListReference',
  STATUS_EFFECT_VIEW_MODE: 'status-effects:viewMode',
  STATUS_EFFECT_FILTERS: 'status-effects:filters',
  WYRMSPELL_VIEW_MODE: 'wyrmspells:viewMode',
  WYRMSPELL_FILTERS: 'wyrmspells:filters',
  RESOURCE_VIEW_MODE: 'resources:viewMode',
  RESOURCE_FILTERS: 'resources:filters',
  TEAMS_VIEW_MODE: 'teams:viewMode',
  TEAMS_FILTERS: 'teams:filters',
  TEAMS_SEARCH: 'teams:search',
  CODES_VIEW_MODE: 'codes:viewMode',
  TIER_LIST_FILTERS: 'tier-list:filters',
  REDEEMED_CODES: 'redeemedCodes',
  SIDEBAR_COLLAPSED: 'sidebar:collapsed',
} as const;
