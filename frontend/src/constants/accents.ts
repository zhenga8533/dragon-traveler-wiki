/**
 * Section-specific accent color mappings
 */

import type { MantineColor } from '@mantine/core';

export type SectionAccent = MantineColor;

export const SECTION_ACCENTS: Record<string, SectionAccent> = {
  // Home
  '/': 'violet',

  // Database
  '/artifacts': 'orange',
  '/characters': 'blue',
  '/gear': 'cyan',
  '/gear-sets': 'cyan',
  '/howlkins': 'yellow',
  '/noble-phantasms': 'indigo',
  '/status-effects': 'pink',
  '/wyrmspells': 'violet',
  '/resources': 'green',
  '/subclasses': 'grape',

  // Guides
  '/guides/beginner-qa': 'teal',
  '/guides/star-upgrade-calculator': 'teal',
  '/guides/diamond-calculator': 'teal',
  '/guides/shovel-event': 'green',

  // Other sections
  '/tier-list': 'orange',
  '/teams': 'pink',
  '/codes': 'yellow',
  '/events': 'green',
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

  // Check for noble phantasm page (dynamic route)
  if (path.startsWith('/noble-phantasms/')) {
    return 'indigo';
  }

  if (path.startsWith('/gear-sets/')) {
    return 'cyan';
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
