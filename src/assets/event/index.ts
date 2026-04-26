// Mirrors the scraper's _to_snake_case: lower, replace all non-alphanumeric runs with _, strip edges
function toEventSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const placeholderEventImage = '/assets/event/placeholder.webp';

export function getEventImage(eventName: string): string {
  return `/assets/event/${toEventSlug(eventName)}.webp`;
}
