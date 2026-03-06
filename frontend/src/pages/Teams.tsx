import {
  Badge,
  Button,
  Container,
  Group,
  Image,
  SegmentedControl,
  Stack,
  Title,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FACTION_ICON_MAP } from '../assets/faction';
import ConfirmActionModal from '../components/common/ConfirmActionModal';
import DataFetchError from '../components/common/DataFetchError';
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import LastUpdated from '../components/common/LastUpdated';
import ViewToggle from '../components/common/ViewToggle';
import {
  ListPageLoading,
  ViewModeLoading,
} from '../components/layout/PageLoadingSkeleton';
import TeamBuilder from '../components/tools/TeamBuilder';
import { FACTION_NAMES } from '../constants/colors';
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
  useTeams,
  useWyrmspells,
} from '../hooks/use-common-data';
import { useFilters, useViewMode } from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
import type { FactionName } from '../types/faction';
import type { Team } from '../types/team';
import { loadSavedFromStorage, parseTabMode } from '../utils';
import { toEntitySlug } from '../utils/entity-slug';
import TeamsSavedTab from './teams/TeamsSavedTab';
import TeamsViewTab from './teams/TeamsViewTab';

const TEAMS_PER_PAGE = 12;

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
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
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
  const [editData, setEditData] = useState<Team | null>(
    () => navigationEditTeam ?? null
  );
  const [pendingEditTeam, setPendingEditTeam] = useState<Team | null>(null);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const [savedTeams, setSavedTeams] = useState<Team[]>(() =>
    mode === 'saved'
      ? loadSavedFromStorage<Team>(STORAGE_KEY.TEAMS_MY_SAVED, (v) =>
          Array.isArray(v.members)
        )
      : []
  );
  const [pendingDeleteSavedTeam, setPendingDeleteSavedTeam] = useState<
    string | null
  >(null);
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TEAMS_VIEW_MODE,
    defaultMode: 'grid',
  });
  const loading = loadingTeams || loadingChars || loadingSpells;
  const error = teamsError || charactersError || wyrmspellsError;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.TEAMS_SEARCH, search);
  }, [search]);

  // Handle edit state from navigation
  useEffect(() => {
    if (navigationEditTeam) {
      navigate('?mode=builder', { replace: true, state: {} });
    }
  }, [navigationEditTeam, navigate]);

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
        key: 'factions',
        label: 'Faction',
        options: FACTION_NAMES,
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
        key: 'contentTypes',
        label: 'Content Type',
        options: contentTypeOptions,
      },
    ],
    [contentTypeOptions]
  );

  const activeFilterCount =
    mode === 'view' || mode === 'saved'
      ? viewFilters.factions.length +
        viewFilters.contentTypes.length +
        (search.trim() ? 1 : 0)
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

  const hasBuilderDraft = () => {
    if (typeof window === 'undefined') return true;
    return Boolean(
      window.localStorage.getItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT)
    );
  };

  const openTeamInBuilder = (team: Team) => {
    setEditData(team);
    setSearchParams({ mode: 'builder' });
  };

  const requestEditTeam = (team: Team) => {
    if (!hasBuilderDraft()) {
      openTeamInBuilder(team);
      return;
    }
    setPendingEditTeam(team);
    setConfirmEditOpen(true);
  };

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

  const { page, setPage, totalPages, offset } = usePagination(
    filteredTeams.length,
    TEAMS_PER_PAGE,
    JSON.stringify({ search, viewFilters })
  );
  const paginatedTeams = filteredTeams.slice(offset, offset + TEAMS_PER_PAGE);

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
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            )}
            {(mode === 'view' || mode === 'saved') && (
              <Button
                variant="default"
                size={isMobile ? 'sm' : 'xs'}
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
                filterOpen={filterOpen}
                entityFilterGroups={entityFilterGroups}
                viewFilters={viewFilters}
                search={search}
                onFilterChange={handleFilterChange}
                onSearchChange={setSearch}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
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
                filterOpen={filterOpen}
                entityFilterGroups={entityFilterGroups}
                viewFilters={viewFilters}
                search={search}
                onFilterChange={handleFilterChange}
                onSearchChange={setSearch}
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
