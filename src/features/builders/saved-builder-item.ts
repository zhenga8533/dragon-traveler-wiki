import { toEntitySlug } from '../../utils/entity-slug.ts';

export interface SavedBuilderItem {
  name: string;
  last_updated?: number;
}

export function getSavedBuilderItemKey(name: string) {
  return toEntitySlug(name.trim() || 'Untitled');
}

export function withSavedTimestamp<T extends SavedBuilderItem>(
  item: T,
  timestamp = Math.floor(Date.now() / 1000)
): T {
  return { ...item, last_updated: timestamp };
}
