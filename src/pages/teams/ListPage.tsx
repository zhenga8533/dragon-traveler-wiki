import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import { createFactionFilterGroup } from '@/components/common/EntityFilterGroups';
import LastUpdated from '@/components/common/LastUpdated';
import PageFilterHeaderControls from '@/components/layout/PageFilterHeaderControls';
import {
  ListPageLoading,
  ViewModeLoading,
} from '@/components/layout/PageLoadingSkeleton';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import DataFetchError from '@/components/ui/DataFetchError';
import {
  CONTENT_TYPE_OPTIONS,
  matchesContentTypeFilters,
  normalizeContentTypeFilters,
} from '@/constants/content-types';
import { STORAGE_KEY } from '@/constants/ui';
import TeamBuilder from '@/features/teams/components/TeamBuilder';
import TeamsSavedTab from '@/features/teams/components/TeamsSavedTab';
import TeamsViewTab from '@/features/teams/components/TeamsViewTab';
import type { Team } from '@/features/teams/types';
import {
  countActiveFilters,
  getPageSizeStorageKey,
  useBuilderEditState,
  useCharacterResolution,
  useCharacters,
  useFilters,
  useGradientAccent,
  useIsMobile,
  usePageSize,
  usePagination,
  useTeams,
  useViewMode,
  useWyrmspells,
} from '@/hooks';
import { loadSavedFromStorage, parseTabMode } from '@/utils';
import { toEntitySlug } from '@/utils/entity-slug';
import {
  Container,
  Group,
  SegmentedControl,
  Stack,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const TEAMS_PER_PAGE = 12;
const TEAM_PAGE_SIZE_OPTIONS = {
  grid: [6, 12, 18, 24],
  list: [10, 20, 30, 50],
} as const;

function matchesTeamFilters(
  team: Team,
  search: string,
  viewFilters: Record<string, string[]>
) {
  if (search && !team.name.toLowerCase().includes(search.toLowerCase())) {
    return false;
  }
  if (
    viewFilters.factions.length > 0 &&
    !viewFilters.factions.includes(team.faction)
  ) {
    return false;
  }
  if (!matchesContentTypeFilters(team.content_type, viewFilters.contentTypes)) {
    return false;
  }
  return true;
}

export default function Teams() {
  const { accent } = useGradientAccent();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: teams, loading: loadingTeams, error: teamsError } = useTeams();
  const {
    data: characters,
    loading: loadingChars,
    error: charactersError,
  } = useCharacters();
  const {
    data: wyrmspells,
    loading: loadingSpells,
    error: wyrmspellsError,
  } = useWyrmspells();
  const { filters: viewFilters, setFilters: setViewFilters } = useFilters<
    Record<string, string[]>
  >({
    emptyFilters: { factions: [], contentTypes: [] },
    storageKey: STORAGE_KEY.TEAMS_FILTERS,
  });
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.TEAMS_SEARCH) || '';
  });
  const mode = parseTabMode(searchParams.get('mode'));
  const navigationEditTeam = (location.state as { editTeam?: Team } | null)
    ?.editTeam;
  const {
    editData,
    setEditData,
    pendingEditItem: pendingEditTeam,
    setPendingEditItem: setPendingEditTeam,
    confirmEditOpen,
    setConfirmEditOpen,
    pendingDeleteSavedItem: pendingDeleteSavedTeam,
    setPendingDeleteSavedItem: setPendingDeleteSavedTeam,
    openInBuilder: openTeamInBuilder,
    requestEdit: requestEditTeam,
  } = useBuilderEditState<Team>({
    draftStorageKey: STORAGE_KEY.TEAMS_BUILDER_DRAFT,
    setSearchParams,
    navigationInitialItem: navigationEditTeam,
    navigate,
  });
  const isMobile = useIsMobile();
  const [savedTeams, setSavedTeams] = useState<Team[]>(() =>
    mode === 'saved'
      ? loadSavedFromStorage<Team>(STORAGE_KEY.TEAMS_MY_SAVED, (v) =>
          Array.isArray(v.members)
        )
      : []
  );
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TEAMS_VIEW_MODE,
    defaultMode: 'grid',
  });
  const loading = loadingTeams || loadingChars || loadingSpells;
  const error = teamsError || charactersError || wyrmspellsError;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.TEAMS_SEARCH, search);
  }, [search]);

  const {
    preferredByName: charMap,
    byIdentity: characterByIdentity,
    nameCounts: characterNameCounts,
  } = useCharacterResolution(characters);

  const contentTypeOptions = useMemo(() => [...CONTENT_TYPE_OPTIONS], []);

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
      createFactionFilterGroup(),
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
    setViewFilters({ factions: [], contentTypes: [] });
    setSearch('');
  }, [setViewFilters]);

  function deleteSavedTeam(name: string) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY.TEAMS_MY_SAVED);
      const saves = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      delete saves[toEntitySlug(name)];
      window.localStorage.setItem(
        STORAGE_KEY.TEAMS_MY_SAVED,
        JSON.stringify(saves)
      );
      setSavedTeams((prev) => prev.filter((team) => team.name !== name));
    } catch {
      // ignore
    }
  }

  const filteredSavedTeams = useMemo(() => {
    return savedTeams.filter((team) =>
      matchesTeamFilters(team, search, viewFilters)
    );
  }, [savedTeams, search, viewFilters]);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) =>
      matchesTeamFilters(team, search, viewFilters)
    );
  }, [teams, search, viewFilters]);

  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    TEAM_PAGE_SIZE_OPTIONS[viewMode],
    {
      defaultSize: TEAMS_PER_PAGE,
      storageKey: getPageSizeStorageKey(STORAGE_KEY.TEAMS_VIEW_MODE),
    }
  );

  const { page, setPage, totalPages, offset } = usePagination(
    filteredTeams.length,
    pageSize,
    JSON.stringify({ search, viewFilters })
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize, setPage]);

  const paginatedTeams = filteredTeams.slice(offset, offset + pageSize);

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const t of teams) {
      if (t.last_updated > latest) latest = t.last_updated;
    }
    return latest;
  }, [teams]);

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm" align="baseline">
            <Title order={1}>Teams</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <Group gap="xs">
            {(mode === 'view' || mode === 'saved') && (
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
                      ? 'Search saved teams...'
                      : 'Search teams...'
                  }
                />
              </PageFilterHeaderControls>
            )}
          </Group>
        </Group>

        {loading &&
          (mode === 'builder' ? (
            <ListPageLoading cards={4} />
          ) : (
            <ViewModeLoading viewMode={viewMode} cards={4} cardHeight={200} />
          ))}

        {!loading && error && (
          <DataFetchError
            title="Could not load teams data"
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
                if (newMode === 'saved') {
                  setSavedTeams(
                    loadSavedFromStorage<Team>(
                      STORAGE_KEY.TEAMS_MY_SAVED,
                      (v) => Array.isArray(v.members)
                    )
                  );
                }
                setSearchParams(newMode === 'view' ? {} : { mode: newMode });
                if (newMode === 'view') setEditData(null);
              }}
              data={[
                { label: 'View Teams', value: 'view' },
                { label: 'My Saved', value: 'saved' },
                { label: 'Create Your Own', value: 'builder' },
              ]}
            />

            {mode === 'view' && (
              <TeamsViewTab
                paginatedTeams={paginatedTeams}
                filteredTeams={filteredTeams}
                charMap={charMap}
                characterByIdentity={characterByIdentity}
                characterNameCounts={characterNameCounts}
                viewMode={viewMode}
                search={search}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageSizeChange={setPageSize}
                onRequestEdit={requestEditTeam}
              />
            )}

            {mode === 'saved' && (
              <TeamsSavedTab
                savedTeams={savedTeams}
                filteredSavedTeams={filteredSavedTeams}
                charMap={charMap}
                characterByIdentity={characterByIdentity}
                characterNameCounts={characterNameCounts}
                viewMode={viewMode}
                search={search}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                onRequestEdit={requestEditTeam}
                onRequestDelete={setPendingDeleteSavedTeam}
                onGoToBuilder={() => setSearchParams({ mode: 'builder' })}
              />
            )}

            {mode === 'builder' && (
              <TeamBuilder
                characters={characters}
                charMap={charMap}
                initialData={navigationEditTeam ?? editData}
                wyrmspells={wyrmspells}
              />
            )}
          </>
        )}

        <ConfirmActionModal
          opened={confirmEditOpen}
          onCancel={() => {
            setConfirmEditOpen(false);
            setPendingEditTeam(null);
          }}
          title="Replace current builder data?"
          message="Opening this team will replace your current builder draft."
          confirmLabel="Replace"
          onConfirm={() => {
            if (pendingEditTeam) {
              openTeamInBuilder(pendingEditTeam);
            }
            setConfirmEditOpen(false);
            setPendingEditTeam(null);
          }}
        />

        <ConfirmActionModal
          opened={pendingDeleteSavedTeam !== null}
          onCancel={() => setPendingDeleteSavedTeam(null)}
          title="Delete saved team?"
          message={`This will permanently delete "${pendingDeleteSavedTeam ?? ''}" from your saved teams.`}
          confirmLabel="Delete"
          confirmColor="red"
          onConfirm={() => {
            if (pendingDeleteSavedTeam) deleteSavedTeam(pendingDeleteSavedTeam);
            setPendingDeleteSavedTeam(null);
          }}
        />
      </Stack>
    </Container>
  );
}
