/**
 * Section-specific accent color mappings
 */

import type { MantineColor } from '@mantine/core';

export type SectionAccent = MantineColor;

export const SECTION_ACCENTS: Record<string, SectionAccent> = {
  // Home
  '/': 'violet',

  // Database
  '/characters': 'blue',
  '/status-effects': 'cyan',
  '/wyrmspells': 'indigo',
  '/resources': 'teal',

  // Guides
  '/guides/beginner-qa': 'teal',
  '/guides/star-upgrade-calculator': 'teal',
  '/guides/efficient-spending': 'green',
  '/guides/golden-clover-priority': 'green',

  // Other sections
  '/tier-list': 'orange',
  '/teams': 'pink',
  '/codes': 'yellow',
  '/useful-links': 'gray',
  '/changelog': 'grape',
} as const;

// Parent section accents (for nav items with children)
export const PARENT_ACCENTS: Record<string, SectionAccent> = {
  Database: 'blue',
  Guides: 'teal',
} as const;

/**
 * Get the accent color for a given path
 */
export function getAccentForPath(path: string): SectionAccent {
  // Check for exact match first
  if (SECTION_ACCENTS[path]) {
    return SECTION_ACCENTS[path];
  }

  // Check for character page (dynamic route)
  if (path.startsWith('/characters/')) {
    return 'blue';
  }

  // Check for team page (dynamic route)
  if (path.startsWith('/teams/')) {
    return 'pink';
  }

  // Check for guides prefix
  if (path.startsWith('/guides/')) {
    return 'teal';
  }

  // Default accent
  return 'violet';
}
