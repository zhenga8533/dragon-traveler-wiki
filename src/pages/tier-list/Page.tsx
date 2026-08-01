import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import {
  createClassFilterGroup,
  createFactionFilterGroup,
  createQualityFilterGroup,
} from '@/components/common/EntityFilterGroups';
import LastUpdated from '@/components/common/LastUpdated';
import PageFilterHeaderControls from '@/components/layout/PageFilterHeaderControls';
import {
  BuilderPageLoading,
  ViewModeLoading,
} from '@/components/layout/PageLoadingSkeleton';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import DataFetchError from '@/components/ui/DataFetchError';
import {
  CONTENT_TYPE_OPTIONS,
  matchesContentTypeFilters,
  normalizeContentTypeFilters,
} from '@/constants/content-types';
import { BUILDER_SIDE_LAYOUT_CONTAINER_SIZE, STORAGE_KEY } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import {
  getCharacterIdentityKey,
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';
import TierListBuilder from '@/features/tier-list/components/TierListBuilder';
import TierListSavedTab from '@/features/tier-list/components/TierListSavedTab';
import TierListViewTab from '@/features/tier-list/components/TierListViewTab';
import {
  loadSavedTierLists,
  removeSavedTierList,
} from '@/features/tier-list/saved-tier-lists';
import {
  getTierListEntityType,
  isCharacterTierEntry,
  isNoblePhantasmTierEntry,
  type TierListRankableEntity,
  type TierList as TierListType,
} from '@/features/tier-list/types';
import {
  countActiveFilters,
  useBuilderEditState,
  useCharacterResolution,
  useCharacters,
  useDarkMode,
  useFilters,
  useGradientAccent,
  useIsMobile,
  useNoblePhantasms,
  usePoolLayout,
  useTierListChanges,
  useTierLists,
  useViewMode,
} from '@/hooks';
import { parseTabMode } from '@/utils';
import { toEntitySlug } from '@/utils/entity-slug';
import { downloadElementAsImage } from '@/utils/export-image';
import { showErrorToast } from '@/utils/toast';
import {
  Container,
  Group,
  SegmentedControl,
  Skeleton,
  Stack,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useSearchParamText } from '@/hooks';

function matchesTierListFilters(
  tierList: TierListType,
  search: string,
  viewFilters: Record<string, string[]>
) {
  if (
    search &&
    ![tierList.name, tierList.author, tierList.description ?? '']
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  ) {
    return false;
  }

  if (
    viewFilters.entityTypes.length > 0 &&
    !viewFilters.entityTypes.includes(getTierListEntityType(tierList))
  ) {
    return false;
  }

  if (
    !matchesContentTypeFilters(tierList.content_type, viewFilters.contentTypes)
  ) {
    return false;
  }

  return true;
}

export default function TierList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    data: tierLists,
    loading: loadingTiers,
    error: tierListsError,
    retry: retryTierLists,
  } = useTierLists();
  const {
    data: characters,
    loading: loadingChars,
    error: charactersError,
    retry: retryCharacters,
  } = useCharacters();
  const {
    data: noblePhantasms,
    loading: loadingNoblePhantasms,
    error: noblePhantasmsError,
    retry: retryNoblePhantasms,
  } = useNoblePhantasms();
  const { data: tierListChanges } = useTierListChanges();
  interface TierListViewFilters {
    [key: string]: string[];
    contentTypes: string[];
    entityTypes: string[];
    factions: string[];
    classes: string[];
    qualities: string[];
  }

  const { filters: viewFilters, setFilters: setViewFilters } =
    useFilters<TierListViewFilters>({
      emptyFilters: {
        contentTypes: [],
        entityTypes: [],
        factions: [],
        classes: [],
        qualities: [],
      },
      storageKey: STORAGE_KEY.TIER_LIST_FILTERS,
    });
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState(() => {
    const destinationSearch = searchParams.get('search');
    if (destinationSearch !== null) return destinationSearch;
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.TIER_LIST_SEARCH) || '';
  });
  useSearchParamText(setSearch);
  const mode = parseTabMode(searchParams.get('mode'));
  const {
    editData,
    setEditData,
    pendingEditItem: pendingEditTierList,
    setPendingEditItem: setPendingEditTierList,
    confirmEditOpen,
    setConfirmEditOpen,
    pendingDeleteSavedItem: pendingDeleteSavedTierList,
    setPendingDeleteSavedItem: setPendingDeleteSavedTierList,
    openInBuilder: openTierListInBuilder,
    requestEdit: requestEditTierList,
  } = useBuilderEditState<TierListType>({
    draftStorageKey: STORAGE_KEY.TIER_LIST_BUILDER_DRAFT,
    setSearchParams,
  });
  const [savedTierLists, setSavedTierLists] = useState<TierListType[]>(() =>
    mode === 'saved' ? loadSavedTierLists() : []
  );
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TIER_LIST_VIEW_MODE,
    defaultMode: 'grid',
  });
  const [isCapturingTierList, setIsCapturingTierList] = useState<string | null>(
    null
  );
  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const { accent } = useGradientAccent();
  const {
    layout: poolLayout,
    setLayout: setPoolLayout,
    canUseSideLayout: canUseSidePoolLayout,
  } = usePoolLayout();
  const loading = loadingTiers || loadingChars || loadingNoblePhantasms;
  const error = tierListsError || charactersError || noblePhantasmsError;

  const {
    preferredByName: preferredCharacterByName,
    byIdentity: characterByIdentity,
  } = useCharacterResolution(characters);

  const charMap = preferredCharacterByName;

  const noblePhantasmBySlug = useMemo(() => {
    const result = new Map(noblePhantasms.map((item) => [item.slug, item]));
    for (const item of noblePhantasms) {
      if (item.legacy_slug) result.set(item.legacy_slug, item);
    }
    return result;
  }, [noblePhantasms]);

  const resolveTierEntryCharacter = useCallback(
    (entry: TierListType['entries'][number]) =>
      isCharacterTierEntry(entry)
        ? resolveCharacterByNameAndQuality(
            entry.character_slug,
            entry.character_quality,
            preferredCharacterByName,
            characterByIdentity
          )
        : null,
    [preferredCharacterByName, characterByIdentity]
  );

  const resolveTierEntryEntity = useCallback(
    (
      entry: TierListType['entries'][number]
    ): TierListRankableEntity | undefined => {
      if (isNoblePhantasmTierEntry(entry)) {
        const noblePhantasm = noblePhantasmBySlug.get(
          entry.noble_phantasm_slug
        );
        return noblePhantasm
          ? {
              key: noblePhantasm.slug,
              entityType: 'noble_phantasm',
              noblePhantasm,
            }
          : undefined;
      }
      const character = resolveTierEntryCharacter(entry);
      return character
        ? {
            key: getCharacterIdentityKey(character),
            entityType: 'character',
            character,
          }
        : undefined;
    },
    [noblePhantasmBySlug, resolveTierEntryCharacter]
  );

  const contentTypeOptions = useMemo(() => [...CONTENT_TYPE_OPTIONS], []);
  const hasEntityFilters =
    viewFilters.factions.length > 0 ||
    viewFilters.classes.length > 0 ||
    viewFilters.qualities.length > 0;

  const matchesCharacterViewFilters = useCallback(
    (character: Character) => {
      if (
        viewFilters.factions.length > 0 &&
        !character.factions.some((faction) =>
          viewFilters.factions.includes(faction)
        )
      ) {
        return false;
      }

      if (
        viewFilters.classes.length > 0 &&
        !viewFilters.classes.includes(character.character_class)
      ) {
        return false;
      }

      if (
        viewFilters.qualities.length > 0 &&
        !viewFilters.qualities.includes(character.quality)
      ) {
        return false;
      }

      return true;
    },
    [viewFilters.factions, viewFilters.classes, viewFilters.qualities]
  );

  const matchesEntityViewFilters = useCallback(
    (entity: TierListRankableEntity) => {
      if (entity.character) {
        return matchesCharacterViewFilters(entity.character);
      }
      const noblePhantasm = entity.noblePhantasm;
      if (!noblePhantasm) return false;
      if (
        viewFilters.factions.length > 0 ||
        viewFilters.classes.length > 0
      ) {
        return false;
      }
      return (
        viewFilters.qualities.length === 0 ||
        viewFilters.qualities.includes(noblePhantasm.quality)
      );
    },
    [
      matchesCharacterViewFilters,
      viewFilters.classes.length,
      viewFilters.factions.length,
      viewFilters.qualities,
    ]
  );

  useEffect(() => {
    const deduped = normalizeContentTypeFilters(viewFilters.contentTypes);
    const unchanged =
      deduped.length === viewFilters.contentTypes.length &&
      deduped.every(
        (value, index) => value === viewFilters.contentTypes[index]
      );
    if (unchanged) return;
    setViewFilters((prev) => ({ ...prev, contentTypes: deduped }));
  }, [viewFilters.contentTypes, setViewFilters]);

  const entityFilterGroups: ChipFilterGroup[] = useMemo(
    () => [
      {
        key: 'contentTypes',
        label: 'Content Type',
        options: contentTypeOptions,
      },
      {
        key: 'entityTypes',
        label: 'Entity Type',
        options: ['character', 'noble_phantasm'],
        labelFn: (value) =>
          value === 'noble_phantasm' ? 'Noble Phantasms' : 'Characters',
      },
      createFactionFilterGroup(),
      createClassFilterGroup(),
      createQualityFilterGroup(),
    ],
    [contentTypeOptions]
  );

  const activeFilterCount =
    mode === 'view' || mode === 'saved'
      ? countActiveFilters(viewFilters) + (search.trim() ? 1 : 0)
      : 0;

  const handleFilterChange = useCallback(
    (key: string, values: string[]) => {
      setViewFilters((prev) => ({ ...prev, [key]: values }));
    },
    [setViewFilters]
  );

  const handleClearFilters = useCallback(() => {
    setViewFilters({
      contentTypes: [],
      entityTypes: [],
      factions: [],
      classes: [],
      qualities: [],
    });
    setSearch('');
  }, [setViewFilters]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.TIER_LIST_SEARCH, search);
  }, [search]);

  const refreshSavedTierLists = useCallback(() => {
    setSavedTierLists(loadSavedTierLists());
  }, []);

  const [prevMode, setPrevMode] = useState(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    if (mode === 'saved') refreshSavedTierLists();
  }

  function deleteSavedTierList(name: string) {
    try {
      removeSavedTierList(toEntitySlug(name));
      setSavedTierLists((prev) => prev.filter((t) => t.name !== name));
      window.dispatchEvent(new CustomEvent('tier-list:saved-changed'));
    } catch {
      showErrorToast({
        title: 'Could not delete tier list',
        message: 'Browser storage could not be updated. Please try again.',
      });
    }
  }

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const tl of tierLists) {
      if (tl.last_updated > latest) latest = tl.last_updated;
    }
    return latest;
  }, [tierLists]);

  const visibleTierLists = useMemo(() => {
    return tierLists.filter((tierList) => {
      if (!matchesTierListFilters(tierList, search, viewFilters)) return false;
      if (!hasEntityFilters) return true;

      return tierList.entries.some((entry) => {
        const entity = resolveTierEntryEntity(entry);
        return entity ? matchesEntityViewFilters(entity) : false;
      });
    });
  }, [
    tierLists,
    search,
    viewFilters,
    hasEntityFilters,
    resolveTierEntryEntity,
    matchesEntityViewFilters,
  ]);

  const visibleSavedTierLists = useMemo(() => {
    return savedTierLists.filter((tierList) => {
      if (!matchesTierListFilters(tierList, search, viewFilters)) return false;
      if (!hasEntityFilters) return true;

      return tierList.entries.some((entry) => {
        const entity = resolveTierEntryEntity(entry);
        return entity ? matchesEntityViewFilters(entity) : false;
      });
    });
  }, [
    savedTierLists,
    search,
    viewFilters,
    hasEntityFilters,
    resolveTierEntryEntity,
    matchesEntityViewFilters,
  ]);

  const handleRequestExport = useCallback(
    async (name: string) => {
      const el = exportRefs.current.get(name);
      if (!el) return;
      setIsCapturingTierList(name);
      try {
        await downloadElementAsImage(el, name, isDark);
      } finally {
        setIsCapturingTierList(null);
      }
    },
    [isDark]
  );

  const exportRefCallback = useCallback(
    (name: string, node: HTMLDivElement | null) => {
      if (node) exportRefs.current.set(name, node);
      else exportRefs.current.delete(name);
    },
    []
  );

  const containerSize =
    mode === 'builder' && poolLayout === 'side'
      ? BUILDER_SIDE_LAYOUT_CONTAINER_SIZE
      : 'lg';

  return (
    <Container size={containerSize} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm" align="baseline">
            <Title order={1}>Tier List</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <Group gap="xs">
            {!isMobile && (mode === 'view' || mode === 'saved') && (
              <PageFilterHeaderControls
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                filterOpen={filterOpen}
                onFilterToggle={toggleFilter}
              >
                <EntityFilter
                  groups={entityFilterGroups}
                  selected={viewFilters}
                  onChange={handleFilterChange}
                  onClear={handleClearFilters}
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder={
                    mode === 'saved'
                      ? 'Search saved tier lists...'
                      : 'Search tier lists...'
                  }
                />
              </PageFilterHeaderControls>
            )}
          </Group>
        </Group>


        {isMobile && (mode === 'view' || mode === 'saved') && (
          <PageFilterHeaderControls
            sticky
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterToggle={toggleFilter}
          >
            <EntityFilter
              groups={entityFilterGroups}
              selected={viewFilters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={
                mode === 'saved'
                  ? 'Search saved tier lists...'
                  : 'Search tier lists...'
              }
            />
          </PageFilterHeaderControls>
        )}

        {loading && (
          <Stack gap="md">
            <Skeleton height={36} radius="md" aria-hidden="true" />
            {mode === 'builder' ? (
              <BuilderPageLoading />
            ) : (
              <ViewModeLoading
                viewMode={viewMode}
                cardHeight={180}
                showPagination
                label="Loading tier lists"
              />
            )}
          </Stack>
        )}

        {!loading && error && (
          <DataFetchError
            title="Could not load tier lists"
            message={error.message}
            onRetry={() => {
              retryTierLists();
              retryCharacters();
              retryNoblePhantasms();
            }}
          />
        )}

        {!loading && !error && (
          <>
            <SegmentedControl
              fullWidth
              size={isMobile ? 'sm' : 'md'}
              color={accent.primary}
              value={mode}
              onChange={(val) => {
                const newMode = val as 'view' | 'saved' | 'builder';
                setSearchParams(newMode === 'view' ? {} : { mode: newMode });
                if (newMode === 'view') setEditData(null);
              }}
              data={[
                { label: 'View Tier Lists', value: 'view' },
                { label: 'My Saved', value: 'saved' },
                { label: 'Create Your Own', value: 'builder' },
              ]}
            />

            {mode === 'view' && (
              <TierListViewTab
                visibleTierLists={visibleTierLists}
                characters={characters}
                noblePhantasms={noblePhantasms}
                resolveTierEntryEntity={resolveTierEntryEntity}
                viewMode={viewMode}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                tierListChanges={tierListChanges}
                onRequestEdit={requestEditTierList}
                onRequestExport={handleRequestExport}
                isExporting={isCapturingTierList}
                exportRefCallback={exportRefCallback}
                entityFilter={matchesEntityViewFilters}
                hasEntityFilters={hasEntityFilters}
              />
            )}

            {mode === 'saved' && (
              <TierListSavedTab
                savedTierLists={savedTierLists}
                visibleSavedTierLists={visibleSavedTierLists}
                resolveTierEntryEntity={resolveTierEntryEntity}
                viewMode={viewMode}
                search={search}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                onRequestEdit={requestEditTierList}
                onRequestExport={handleRequestExport}
                isExporting={isCapturingTierList}
                exportRefCallback={exportRefCallback}
                onRequestDelete={setPendingDeleteSavedTierList}
                onGoToBuilder={() => setSearchParams({ mode: 'builder' })}
                entityFilter={matchesEntityViewFilters}
                hasEntityFilters={hasEntityFilters}
              />
            )}

            {mode === 'builder' && (
              <TierListBuilder
                characters={characters}
                charMap={charMap}
                noblePhantasms={noblePhantasms}
                initialData={editData}
                poolLayout={poolLayout}
                onPoolLayoutChange={setPoolLayout}
                canUseSidePoolLayout={canUseSidePoolLayout}
              />
            )}
          </>
        )}

        <ConfirmActionModal
          opened={confirmEditOpen}
          onCancel={() => {
            setConfirmEditOpen(false);
            setPendingEditTierList(null);
          }}
          title="Replace current builder data?"
          message="Opening this tier list will replace your current builder draft."
          confirmLabel="Replace"
          onConfirm={() => {
            if (pendingEditTierList) {
              openTierListInBuilder(pendingEditTierList);
            }
            setConfirmEditOpen(false);
            setPendingEditTierList(null);
          }}
        />

        <ConfirmActionModal
          opened={pendingDeleteSavedTierList !== null}
          onCancel={() => setPendingDeleteSavedTierList(null)}
          title="Delete saved tier list?"
          message={`This will permanently delete "${pendingDeleteSavedTierList ?? ''}" from your saved tier lists.`}
          confirmLabel="Delete"
          confirmColor="red"
          onConfirm={() => {
            if (pendingDeleteSavedTierList)
              deleteSavedTierList(pendingDeleteSavedTierList);
            setPendingDeleteSavedTierList(null);
          }}
        />
      </Stack>
    </Container>
  );
}
