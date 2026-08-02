import type { Quality } from '@/types/quality';
import { applyDir } from '@/hooks/use-sort';
import { compareQuality, compareQualityThenName } from '@/utils/quality';
import type { Artifact } from './types';

export interface ArtifactFilters {
  search: string;
  qualities: Quality[];
  footprints: string[];
}

export const EMPTY_ARTIFACT_FILTERS: ArtifactFilters = {
  search: '',
  qualities: [],
  footprints: [],
};

export function matchesArtifactFilters(
  artifact: Artifact,
  filters: ArtifactFilters
) {
  const query = filters.search.trim().toLocaleLowerCase();
  return (
    (!query || artifact.name.toLocaleLowerCase().includes(query)) &&
    (filters.qualities.length === 0 ||
      filters.qualities.includes(artifact.quality)) &&
    (filters.footprints.length === 0 ||
      filters.footprints.includes(`${artifact.rows}x${artifact.columns}`))
  );
}

export function compareArtifacts(
  left: Artifact,
  right: Artifact,
  column: string | null,
  direction: 'asc' | 'desc'
) {
  let comparison = 0;
  if (column === 'name') comparison = left.name.localeCompare(right.name);
  else if (column === 'quality') {
    comparison = compareQuality(left.quality, right.quality);
  } else if (column === 'size') {
    comparison = left.rows * left.columns - right.rows * right.columns;
  } else if (column === 'treasures') {
    comparison = right.treasures.length - left.treasures.length;
  }

  return comparison
    ? applyDir(comparison, direction)
    : compareQualityThenName(
        left.quality,
        right.quality,
        left.name,
        right.name
      );
}
