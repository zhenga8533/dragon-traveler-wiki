import type { GameEvent } from '@/features/wiki/events/types';
import { isGameEventActive } from '@/utils/event-utils';

export type EventTab = 'active' | 'past';

export interface EventFilters {
  search: string;
  servers: string[];
  types: string[];
  characters: string[];
  dateRange: [Date | string | null, Date | string | null];
}

export interface EventEntry {
  id: string;
  active: boolean;
  server: 'Global' | 'TW';
  sortDate: string;
  event: GameEvent;
}

export const EMPTY_EVENT_FILTERS: EventFilters = {
  search: '',
  servers: [],
  types: [],
  characters: [],
  dateRange: [null, null],
};

function parseFilterDate(value: Date | string | null): Date | null {
  if (value === null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  const localDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsed = localDateMatch
    ? new Date(
        Number(localDateMatch[1]),
        Number(localDateMatch[2]) - 1,
        Number(localDateMatch[3]),
      )
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEventDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function overlapsDateRange(
  event: GameEvent,
  [startValue, endValue]: EventFilters['dateRange'],
): boolean {
  const rangeStart = parseFilterDate(startValue);
  const rangeEnd = parseFilterDate(endValue);
  if (rangeStart === null && rangeEnd === null) return true;

  const eventStart = event.start_date ? parseEventDate(event.start_date) : null;
  const eventEnd = event.end_date ? parseEventDate(event.end_date) : null;
  eventEnd?.setHours(23, 59, 59, 999);

  if (rangeStart !== null && eventEnd !== null && eventEnd < rangeStart) {
    return false;
  }
  if (rangeEnd !== null && eventStart !== null) {
    rangeEnd.setHours(23, 59, 59, 999);
    if (eventStart > rangeEnd) return false;
  }
  return true;
}

export function buildEventEntries(events: GameEvent[]): EventEntry[] {
  return events
    .map((event) => ({
      id: `${event.name}__${event.is_global ? 'global' : 'tw'}`,
      active: isGameEventActive(event),
      server: (event.is_global ? 'Global' : 'TW') as EventEntry['server'],
      sortDate: event.start_date ?? event.end_date ?? '',
      event,
    }))
    .sort((left, right) => {
      const dateComparison = right.sortDate.localeCompare(left.sortDate);
      return dateComparison || left.event.name.localeCompare(right.event.name);
    });
}

export function matchesEventFilters(
  entry: EventEntry,
  filters: EventFilters,
): boolean {
  const { event } = entry;
  const search = filters.search.trim().toLowerCase();
  if (search) {
    const searchableText = [
      event.name,
      event.description,
      event.type ?? '',
      entry.server,
      ...event.characters,
    ]
      .join(' ')
      .toLowerCase();
    if (!searchableText.includes(search)) return false;
  }

  if (filters.servers.length > 0 && !filters.servers.includes(entry.server)) {
    return false;
  }
  if (
    filters.types.length > 0 &&
    (!event.type || !filters.types.includes(event.type))
  ) {
    return false;
  }
  if (
    filters.characters.length > 0 &&
    !event.characters.some((character) =>
      filters.characters.includes(character),
    )
  ) {
    return false;
  }

  return overlapsDateRange(event, filters.dateRange);
}
