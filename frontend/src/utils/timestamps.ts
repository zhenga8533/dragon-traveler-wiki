export function getLatestTimestamp(items: { last_updated?: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.last_updated ?? 0), 0);
}
