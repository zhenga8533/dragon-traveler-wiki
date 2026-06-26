export const SUPPORTED_LOCALES = [
  'enUS',
  'zhCN',
  'zhTW',
  'jaJP',
  'koKR',
  'thTH',
  'viVN',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'enUS';

// Files whose canonical data lives in data/<locale>/.
// enUS is authoritative for structural/non-localizable fields.
const LOCALE_FILE_SET = new Set([
  'artifacts.json',
  'characters.json',
  'factions.json',
  'gear.json',
  'gear-sets.json',
  'golden-alliances.json',
  'howlkins.json',
  'noble-phantasm.json',
  'relic.json',
  'resources.json',
  'status-effects.json',
  'subclasses.json',
  'wyrms.json',
  'wyrmspells.json',
]);

// Files shared across all locales — live in data/global/.
const GLOBAL_FILE_SET = new Set([
  'changelog.json',
  'codes.json',
  'events.json',
  'star-levels.json',
  'teams.json',
  'tier-lists.json',
  'useful-links.json',
]);

export function isLocaleFile(filename: string): boolean {
  return LOCALE_FILE_SET.has(filename);
}

export function isGlobalFile(filename: string): boolean {
  return GLOBAL_FILE_SET.has(filename);
}

/** Absolute data path for a JSON file under the given locale (or global). */
export function dataPath(
  filename: string,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  if (GLOBAL_FILE_SET.has(filename)) {
    return `data/global/${filename}`;
  }
  return `data/${locale}/${filename}`;
}

/** Absolute data path for a change-history file. */
export function changesPath(
  filename: string,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  if (GLOBAL_FILE_SET.has(filename)) {
    return `data/global/changes/${filename}`;
  }
  return `data/${locale}/changes/${filename}`;
}
