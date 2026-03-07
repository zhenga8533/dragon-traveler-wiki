import {
  Container,
  Group,
  Image,
  SegmentedControl,
  Stack,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
import ConfirmActionModal from '../components/common/ConfirmActionModal';
import DataFetchError from '../components/common/DataFetchError';
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import LastUpdated from '../components/common/LastUpdated';
import { renderQualityFilterIcon } from '../components/common/renderQualityFilterIcon';
import PageFilterHeaderControls from '../components/layout/PageFilterHeaderControls';
import {
  ListPageLoading,
  ViewModeLoading,
} from '../components/layout/PageLoadingSkeleton';
import TierListBuilder from '../components/tools/TierListBuilder';
import { CLASS_ORDER, FACTION_NAMES, QUALITY_ORDER } from '../constants/colors';
import {
  CONTENT_TYPE_OPTIONS,
  matchesContentTypeFilters,
  normalizeContentTypeFilters,
} from '../constants/content-types';
import { BREAKPOINTS, STORAGE_KEY } from '../constants/ui';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../contexts';
import { useCharacterResolution } from '../hooks';
import {
  useCharacters,
  useTierListChanges,
  useTierLists,
} from '../hooks/use-common-data';
import {
  countActiveFilters,
  useFilters,
  useViewMode,
} from '../hooks/use-filters';
import type { Character, CharacterClass } from '../types/character';
import type { FactionName } from '../types/faction';
import type { TierList as TierListType } from '../types/tier-list';
import { loadSavedFromStorage, parseTabMode } from '../utils';
import { resolveCharacterByNameAndQuality } from '../utils/character-route';
import { toEntitySlug } from '../utils/entity-slug';
import { downloadElementAsPng } from '../utils/export-image';
import TierListSavedTab from './tier-list/TierListSavedTab';
import TierListViewTab from './tier-list/TierListViewTab';

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
  } = useTierLists();
  const {
    data: characters,
    loading: loadingChars,
    error: charactersError,
  } = useCharacters();
  const { data: tierListChanges } = useTierListChanges();
  interface TierListViewFilters {
    [key: string]: string[];
    contentTypes: string[];
    factions: string[];
    classes: string[];
    qualities: string[];
  }

  const { filters: viewFilters, setFilters: setViewFilters } =
    useFilters<TierListViewFilters>({
      emptyFilters: {
        contentTypes: [],
        factions: [],
        classes: [],
        qualities: [],
      },
      storageKey: STORAGE_KEY.TIER_LIST_FILTERS,
    });
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.TIER_LIST_SEARCH) || '';
  });
  const mode = parseTabMode(searchParams.get('mode'));
  const [editData, setEditData] = useState<TierListType | null>(null);
  const [pendingEditTierList, setPendingEditTierList] =
    useState<TierListType | null>(null);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [savedTierLists, setSavedTierLists] = useState<TierListType[]>([]);
  const [pendingDeleteSavedTierList, setPendingDeleteSavedTierList] = useState<
    string | null
  >(null);
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TIER_LIST_VIEW_MODE,
    defaultMode: 'grid',
  });
  const [isCapturingTierList, setIsCapturingTierList] = useState<string | null>(
    null
  );
  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isDark = useComputedColorScheme('light') === 'dark';
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
  const loading = loadingTiers || loadingChars;
  const error = tierListsError || charactersError;

  const {
    preferredByName: preferredCharacterByName,
    byIdentity: characterByIdentity,
    nameCounts: characterNameCounts,
  } = useCharacterResolution(characters);

  const charMap = preferredCharacterByName;

  const resolveTierEntryCharacter = useCallback(
    (entry: TierListType['entries'][number]) =>
      resolveCharacterByNameAndQuality(
        entry.character_name,
        entry.character_quality,
        preferredCharacterByName,
        characterByIdentity
      ),
    [preferredCharacterByName, characterByIdentity]
  );

  const contentTypeOptions = useMemo(() => [...CONTENT_TYPE_OPTIONS], []);
  const hasCharacterFilters =
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
        key: 'factions',
        label: 'Faction',
        options: [...FACTION_NAMES],
        icon: (value: string) => (
          <Image
            src={FACTION_ICON_MAP[value as FactionName]}
            alt={value}
            w={14}
            h={14}
            fit="contain"
          />
        ),
      },
      {
        key: 'classes',
        label: 'Class',
        options: [...CLASS_ORDER],
        icon: (value: string) => (
          <Image
            src={CLASS_ICON_MAP[value as CharacterClass]}
            alt={value}
            w={14}
            h={14}
            fit="contain"
          />
        ),
      },
      {
        key: 'qualities',
        label: 'Quality',
        options: [...QUALITY_ORDER],
        icon: renderQualityFilterIcon,
      },
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
      factions: [],
      classes: [],
      qualities: [],
    });
    setSearch('');
  }, [setViewFilters]);

  const hasBuilderDraft = () => {
    if (typeof window === 'undefined') return true;
    return Boolean(
      window.localStorage.getItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT)
    );
  };

  const openTierListInBuilder = (tierList: TierListType) => {
    setEditData(tierList);
    setSearchParams({ mode: 'builder' });
  };

  const requestEditTierList = (tierList: TierListType) => {
    if (!hasBuilderDraft()) {
      openTierListInBuilder(tierList);
      return;
    }
    setPendingEditTierList(tierList);
    setConfirmEditOpen(true);
  };

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.TIER_LIST_SEARCH, search);
  }, [search]);

  const refreshSavedTierLists = useCallback(() => {
    setSavedTierLists(
      loadSavedFromStorage<TierListType>(STORAGE_KEY.TIER_LIST_MY_SAVED, (v) =>
        Array.isArray(v.entries)
      )
    );
  }, []);

  useEffect(() => {
    if (mode === 'saved') refreshSavedTierLists();
  }, [mode, refreshSavedTierLists]);

  function deleteSavedTierList(name: string) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY.TIER_LIST_MY_SAVED);
      const saves = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      delete saves[toEntitySlug(name)];
      window.localStorage.setItem(
        STORAGE_KEY.TIER_LIST_MY_SAVED,
        JSON.stringify(saves)
      );
      setSavedTierLists((prev) => prev.filter((t) => t.name !== name));
    } catch {
      // ignore
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
      if (!hasCharacterFilters) return true;

      return tierList.entries.some((entry) => {
        const character = resolveTierEntryCharacter(entry);
        return character ? matchesCharacterViewFilters(character) : false;
      });
    });
  }, [
    tierLists,
    search,
    viewFilters,
    hasCharacterFilters,
    resolveTierEntryCharacter,
    matchesCharacterViewFilters,
  ]);

  const visibleSavedTierLists = useMemo(() => {
    return savedTierLists.filter((tierList) => {
      if (!matchesTierListFilters(tierList, search, viewFilters)) return false;
      if (!hasCharacterFilters) return true;

      return tierList.entries.some((entry) => {
        const character = resolveTierEntryCharacter(entry);
        return character ? matchesCharacterViewFilters(character) : false;
      });
    });
  }, [
    savedTierLists,
    search,
    viewFilters,
    hasCharacterFilters,
    resolveTierEntryCharacter,
    matchesCharacterViewFilters,
  ]);

  const handleRequestExport = useCallback(
    async (name: string) => {
      const el = exportRefs.current.get(name);
      if (!el) return;
      setIsCapturingTierList(name);
      try {
        await downloadElementAsPng(el, name, isDark);
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

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm" align="baseline">
            <Title order={1}>Tier List</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <Group gap="xs">
            {(mode === 'view' || mode === 'saved') && (
              <PageFilterHeaderControls
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterCount={activeFilterCount}
                onFilterToggle={toggleFilter}
                isMobile={isMobile}
              />
            )}
          </Group>
        </Group>

        {loading &&
          (mode === 'builder' ? (
            <ListPageLoading cards={3} />
          ) : (
            <ViewModeLoading viewMode={viewMode} cards={3} cardHeight={180} />
          ))}

        {!loading && error && (
          <DataFetchError
            title="Could not load tier lists"
            message={error.message}
            onRetry={() => window.location.reload()}
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
                resolveTierEntryCharacter={resolveTierEntryCharacter}
                characterNameCounts={characterNameCounts}
                viewMode={viewMode}
                filterOpen={filterOpen}
                entityFilterGroups={entityFilterGroups}
                viewFilters={viewFilters}
                search={search}
                onFilterChange={handleFilterChange}
                onSearchChange={setSearch}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                tierListChanges={tierListChanges}
                onRequestEdit={requestEditTierList}
                onRequestExport={handleRequestExport}
                isExporting={isCapturingTierList}
                exportRefCallback={exportRefCallback}
                characterFilter={matchesCharacterViewFilters}
                hasCharacterFilters={hasCharacterFilters}
              />
            )}

            {mode === 'saved' && (
              <TierListSavedTab
                savedTierLists={savedTierLists}
                visibleSavedTierLists={visibleSavedTierLists}
                resolveTierEntryCharacter={resolveTierEntryCharacter}
                characterNameCounts={characterNameCounts}
                viewMode={viewMode}
                filterOpen={filterOpen}
                entityFilterGroups={entityFilterGroups}
                viewFilters={viewFilters}
                search={search}
                onFilterChange={handleFilterChange}
                onSearchChange={setSearch}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                onRequestEdit={requestEditTierList}
                onRequestExport={handleRequestExport}
                isExporting={isCapturingTierList}
                exportRefCallback={exportRefCallback}
                onRequestDelete={setPendingDeleteSavedTierList}
                onGoToBuilder={() => setSearchParams({ mode: 'builder' })}
                characterFilter={matchesCharacterViewFilters}
              />
            )}

            {mode === 'builder' && (
              <TierListBuilder
                characters={characters}
                charMap={charMap}
                initialData={editData}
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
