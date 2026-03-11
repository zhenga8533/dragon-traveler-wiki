import type { TwEvent } from '@/types';

const TW_TYPE_COLOR: Record<string, string> = {
  Release: 'blue',
  Skin: 'teal',
  'Mythic Ascension': 'violet',
  Rerun: 'gray',
};

export function isTwEventActive(event: TwEvent): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (!event.start_date || !event.end_date) return false;
  if (event.start_date.length < 10 || event.end_date.length < 10) return false;
  return event.start_date <= today && event.end_date >= today;
}

export function getTwEventTypeColor(type: string): string {
  return TW_TYPE_COLOR[type] ?? 'gray';
}
