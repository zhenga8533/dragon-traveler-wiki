import type { GameEvent } from '@/types';

const EVENT_TYPE_COLOR: Record<string, string> = {
  Release: 'blue',
  Skin: 'teal',
  'Mythic Ascension': 'violet',
  Rerun: 'gray',
};

export function isGameEventActive(event: GameEvent): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (event.start_date && event.start_date > today) return false;
  if (event.end_date === null) return true;
  return event.end_date >= today;
}

export function getEventTypeColor(type: string): string {
  return EVENT_TYPE_COLOR[type] ?? 'gray';
}
