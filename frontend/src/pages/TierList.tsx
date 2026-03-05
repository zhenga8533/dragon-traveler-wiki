import {
  Badge,
  Button,
  Container,
  Group,
  SegmentedControl,
  Stack,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { downloadElementAsPng } from '../utils/export-image';
import { IoFilter } from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';
import ConfirmActionModal from '../components/common/ConfirmActionModal';
import DataFetchError from '../components/common/DataFetchError';
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import LastUpdated from '../components/common/LastUpdated';
import ViewToggle from '../components/common/ViewToggle';
import {
  ListPageLoading,
  ViewModeLoading,
} from '../components/layout/PageLoadingSkeleton';
import TierListBuilder from '../components/tools/TierListBuilder';
import {
  CONTENT_TYPE_OPTIONS,
  normalizeContentType,
} from '../constants/content-types';
import { STORAGE_KEY } from '../constants/ui';
import { toEntitySlug } from '../utils/entity-slug';
import { useCharacterResolution } from '../hooks';
import { useFilters, useViewMode } from '../hooks/use-filters';
import { useCharacters, useTierListChanges, useTierLists } from '../hooks/use-common-data';
import type { TierList as TierListType } from '../types/tier-list';
import { resolveCharacterByNameAndQuality } from '../utils/character-route';
import TierListSavedTab from './tier-list/TierListSavedTab';
import TierListViewTab from './tier-list/TierListViewTab';

function parseMode(raw: string | null): 'view' | 'saved' | 'builder' {
  if (raw === 'saved' || raw === 'builder') return raw;
  return 'view';
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
  const { filters: viewFilters, setFilters: setViewFilters } = useFilters<
    Record<string, string[]>
  >({
    emptyFilters: { contentTypes: [] },
    storageKey: STORAGE_KEY.TIER_LIST_FILTERS,
  });
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.TIER_LIST_SEARCH) || '';
  });
  const mode = parseMode(searchParams.get('mode'));
  const [editData, setEditData] = useState<TierListType | null>(null);
  const [pendingEditTierList, setPendingEditTierList] =
    useState<TierListType | null>(null);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [savedTierLists, setSavedTierLists] = useState<TierListType[]>([]);
  const [pendingDeleteSavedTierList, setPendingDeleteSavedTierList] = useState<string | null>(null);
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TIER_LIST_VIEW_MODE,
    defaultMode: 'grid',
  });
  const [isCapturingTierList, setIsCapturingTierList] = useState<string | null>(null);
  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isDark = useComputedColorScheme('light') === 'dark';
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

  useEffect(() => {
    const normalized = viewFilters.contentTypes.map((value) =>
      normalizeContentType(value, 'All')
    );
    const deduped = [...new Set(normalized)];
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
    ],
    [contentTypeOptions]
  );

  const activeFilterCount =
    mode === 'view'
      ? viewFilters.contentTypes.length + (search.trim() ? 1 : 0)
      : 0;

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
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY.TIER_LIST_MY_SAVED);
      if (!raw) { setSavedTierLists([]); return; }
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const lists = Object.values(parsed)
        .filter((v): v is TierListType =>
          v !== null && typeof v === 'object' && Array.isArray((v as TierListType).entries)
        )
        .sort((a, b) => (b.last_updated ?? 0) - (a.last_updated ?? 0));
      setSavedTierLists(lists);
    } catch {
      setSavedTierLists([]);
    }
  }, []);

  useEffect(() => {
    if (mode === 'saved') refreshSavedTierLists();
  }, [mode, refreshSavedTierLists]);

  function deleteSavedTierList(name: string) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY.TIER_LIST_MY_SAVED);
      const saves = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      delete saves[toEntitySlug(name)];
      window.localStorage.setItem(STORAGE_KEY.TIER_LIST_MY_SAVED, JSON.stringify(saves));
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
    return tierLists.filter((tl) => {
      if (
        search &&
        ![tl.name, tl.author, tl.description ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;

      if (
        viewFilters.contentTypes.length > 0 &&
        !viewFilters.contentTypes.includes(
          normalizeContentType(tl.content_type, 'All')
        )
      )
        return false;

      return true;
    });
  }, [tierLists, search, viewFilters]);

  useEffect(() => {
    if (!isCapturingTierList) return;
    const el = exportRefs.current.get(isCapturingTierList);
    if (!el) return;
    const name = isCapturingTierList;
    const run = async () => {
      try {
        await downloadElementAsPng(el, name, isDark);
      } finally {
        setIsCapturingTierList(null);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapturingTierList]);

  const exportRefCallback = useCallback(
    (name: string, node: HTMLDivElement | null) => {
      if (node) exportRefs.current.set(name, node);
      else exportRefs.current.delete(name);
    },
    []
  );

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Tier List</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <Group gap="xs">
            {(mode === 'view' || mode === 'saved') && (
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            )}
            {mode === 'view' && (
              <Button
                variant="default"
                size="xs"
                leftSection={<IoFilter size={16} />}
                rightSection={
                  activeFilterCount > 0 ? (
                    <Badge size="xs" circle variant="filled">
                      {activeFilterCount}
                    </Badge>
                  ) : null
                }
                onClick={toggleFilter}
              >
                Filters
              </Button>
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
                onFilterChange={(key, values) =>
                  setViewFilters((prev) => ({ ...prev, [key]: values }))
                }
                onSearchChange={setSearch}
                onClearFilters={() => {
                  setViewFilters({ contentTypes: [] });
                  setSearch('');
                }}
                onOpenFilters={toggleFilter}
                tierListChanges={tierListChanges}
                onRequestEdit={requestEditTierList}
                onRequestExport={setIsCapturingTierList}
                isExporting={isCapturingTierList}
                exportRefCallback={exportRefCallback}
              />
            )}

            {mode === 'saved' && (
              <TierListSavedTab
                savedTierLists={savedTierLists}
                resolveTierEntryCharacter={resolveTierEntryCharacter}
                characterNameCounts={characterNameCounts}
                viewMode={viewMode}
                onRequestEdit={requestEditTierList}
                onRequestDelete={setPendingDeleteSavedTierList}
                onGoToBuilder={() => setSearchParams({ mode: 'builder' })}
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
            if (pendingDeleteSavedTierList) deleteSavedTierList(pendingDeleteSavedTierList);
            setPendingDeleteSavedTierList(null);
          }}
        />
      </Stack>

    </Container>
  );
}
