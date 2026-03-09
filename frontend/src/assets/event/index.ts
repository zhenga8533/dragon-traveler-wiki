// Mirrors the scraper's _to_snake_case: lower, replace all non-alphanumeric runs with _, strip edges
function toEventSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const eventImageModules = import.meta.glob<{ default: string }>('./*.webp', {
  eager: true,
});

const eventImages = new Map<string, string>();

for (const [path, module] of Object.entries(eventImageModules)) {
  const match = path.match(/\.\/([^/]+)\.webp$/);
  if (match) {
    eventImages.set(match[1], module.default);
  }
}

export const placeholderEventImage = eventImages.get('placeholder') as string;

export function getEventImage(eventName: string): string {
  return eventImages.get(toEventSlug(eventName)) ?? placeholderEventImage;
}
