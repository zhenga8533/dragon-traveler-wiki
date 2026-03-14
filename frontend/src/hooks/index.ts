// Hook exports for cleaner imports
export { useCharacterAssets } from '@/features/characters/hooks/use-character-assets';
export { useCharacterListData } from '@/features/characters/hooks/use-character-list-data';
export type { CharacterListData } from '@/features/characters/hooks/use-character-list-data';
export {
  getCharacterNavPaths,
  useCharacterPageData,
} from '@/features/characters/hooks/use-character-page-data';
export type { CharacterPageData } from '@/features/characters/hooks/use-character-page-data';
export { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
export type { CharacterResolution } from '@/features/characters/hooks/use-character-resolution';
export {
  useCharacterChanges,
  useCharacters,
} from '@/features/characters/hooks/use-characters-data';
export {
  useTeamChanges,
  useTeams,
} from '@/features/teams/hooks/use-teams-data';
export {
  useTierListChanges,
  useTierLists,
} from '@/features/tier-list/hooks/use-tier-list-data';
export {
  useArtifacts,
  useGear,
  useGearSets,
  useNoblePhantasms,
  useStatusEffects,
  useSubclasses,
  useWyrmspells,
} from '@/features/wiki/hooks/use-wiki-data';
export { useFactions } from './use-factions';
export { useDarkMode } from './use-dark-mode';
export { useDataFetch } from './use-data-fetch';
export { useFilteredPageData } from './use-filtered-page-data';
export {
  countActiveFilters,
  useFilterPanel,
  useFilteredData,
  useFilters,
  useViewMode,
} from './use-filters';
export { useGradientAccent } from './use-gradient-accent';
export { useIsMobile } from './use-is-mobile';
export { useMobileTooltip } from './use-mobile-tooltip';
export {
  buildRowAlignedPageSizeOptions,
  getPageSizeStorageKey,
  resolvePageSizeOptions,
  usePageSize,
  usePagination,
} from './use-pagination';
export { useSidebar } from './use-sidebar';
export { applyDir, useSortState } from './use-sort';
export { useEntityTabParam, useTabParam } from './use-tab-param';

// Re-export hook types
export type { DataFetchResult } from './use-data-fetch';
export type { ViewMode } from './use-filters';
export type { PageSizeOptionsByViewMode } from './use-pagination';
export type { UseSidebarReturn } from './use-sidebar';
