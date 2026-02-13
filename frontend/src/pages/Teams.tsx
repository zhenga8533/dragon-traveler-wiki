import {
  Badge,
  Button,
  Collapse,
  Container,
  Group,
  Image,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { IoCreate, IoFilter, IoSearch } from 'react-icons/io5';
import { useLocation, useNavigate } from 'react-router-dom';
import { FACTION_ICON_MAP } from '../assets/faction';
import { FACTION_WYRM_MAP } from '../assets/wyrms';
import CharacterCard from '../components/CharacterCard';
import PaginationControl from '../components/PaginationControl';
import DataFetchError from '../components/DataFetchError';
import EmptyState from '../components/EmptyState';
import type { ChipFilterGroup } from '../components/EntityFilter';
import EntityFilter from '../components/EntityFilter';
import TeamBuilder from '../components/TeamBuilder';
import { FACTION_COLOR } from '../constants/colors';
import { CARD_HOVER_STYLES, cardHoverHandlers } from '../constants/styles';
import { CHARACTER_GRID_SPACING, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilters } from '../hooks/use-filters';
import type { Character } from '../types/character';
import type { FactionName } from '../types/faction';
import type { Team } from '../types/team';
import type { Wyrmspell } from '../types/wyrmspell';

const TEAMS_PER_PAGE = 12;

const FACTIONS: FactionName[] = [
  'Elemental Echo',
  'Wild Spirit',
  'Arcane Wisdom',
  'Sanctum Glory',
  'Otherworld Return',
  'Illusion Veil',
];

export default function Teams() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    data: teams,
    loading: loadingTeams,
    error: teamsError,
  } = useDataFetch<Team[]>('data/teams.json', []);
  const {
    data: characters,
    loading: loadingChars,
    error: charactersError,
  } = useDataFetch<Character[]>('data/characters.json', []);
  const {
    data: wyrmspells,
    loading: loadingSpells,
    error: wyrmspellsError,
  } = useDataFetch<Wyrmspell[]>('data/wyrmspells.json', []);
  const { filters: viewFilters, setFilters: setViewFilters } = useFilters<
    Record<string, string[]>
  >({
    emptyFilters: { factions: [], contentTypes: [] },
    storageKey: STORAGE_KEY.TEAMS_FILTERS,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.TEAMS_SEARCH) || '';
  });
  const [mode, setMode] = useState<'view' | 'builder'>('view');
  const [editData, setEditData] = useState<Team | null>(null);
  const loading = loadingTeams || loadingChars || loadingSpells;
  const error = teamsError || charactersError || wyrmspellsError;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.TEAMS_SEARCH, search);
  }, [search]);

  // Handle edit state from navigation
  useEffect(() => {
    if (location.state?.editTeam) {
      setEditData(location.state.editTeam);
      setMode('builder');
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(c.name, c);
    return map;
  }, [characters]);

  const contentTypeOptions = useMemo(
    () => [...new Set(teams.map((t) => t.content_type))].sort(),
    [teams]
  );

  const entityFilterGroups: ChipFilterGroup[] = useMemo(
    () => [
      {
        key: 'factions',
        label: 'Faction',
        options: FACTIONS,
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
    mode === 'view'
      ? viewFilters.factions.length + viewFilters.contentTypes.length
      : 0;

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      if (search && !team.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (
        viewFilters.factions.length > 0 &&
        !viewFilters.factions.includes(team.faction)
      )
        return false;
      if (
        viewFilters.contentTypes.length > 0 &&
        !viewFilters.contentTypes.includes(team.content_type)
      )
        return false;
      return true;
    });
  }, [teams, search, viewFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, viewFilters]);

  const totalPages = Math.ceil(filteredTeams.length / TEAMS_PER_PAGE);
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * TEAMS_PER_PAGE,
    currentPage * TEAMS_PER_PAGE
  );

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Teams</Title>
          <Group gap="xs">
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
          </Group>
        </Group>

        {loading && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={200} radius="md" />
            ))}
          </SimpleGrid>
        )}

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
              value={mode}
              onChange={(val) => {
                setMode(val as 'view' | 'builder');
                if (val === 'view') setEditData(null);
              }}
              data={[
                { label: 'View Teams', value: 'view' },
                { label: 'Create Your Own', value: 'builder' },
              ]}
            />

            {mode === 'view' && (
              <Collapse in={filterOpen}>
                <Paper p="md" radius="md" withBorder>
                  <EntityFilter
                    groups={entityFilterGroups}
                    selected={viewFilters}
                    onChange={(key, values) =>
                      setViewFilters((prev) => ({ ...prev, [key]: values }))
                    }
                    onClear={() =>
                      setViewFilters({ factions: [], contentTypes: [] })
                    }
                  />
                </Paper>
              </Collapse>
            )}

            {mode === 'view' && (
              <>
                <TextInput
                  placeholder="Search teams..."
                  leftSection={<IoSearch size={16} />}
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                />

                {filteredTeams.length === 0 && (
                  <EmptyState
                    title={search ? 'No teams found' : 'No matching teams'}
                    description={
                      search
                        ? 'No teams match your search.'
                        : 'No teams match the current filters.'
                    }
                  />
                )}

                {paginatedTeams.map((team) => (
                  <Paper
                    key={team.name}
                    p="md"
                    radius="md"
                    withBorder
                    style={CARD_HOVER_STYLES}
                    {...cardHoverHandlers}
                    onClick={() =>
                      navigate(`/teams/${encodeURIComponent(team.name)}`)
                    }
                  >
                    <Stack gap="sm">
                      <Group
                        justify="space-between"
                        align="flex-start"
                        wrap="wrap"
                      >
                        <Group gap="sm">
                          <Image
                            src={FACTION_WYRM_MAP[team.faction as FactionName]}
                            alt={`${team.faction} Whelp`}
                            w={40}
                            h={40}
                            fit="contain"
                          />
                          <Text
                            fw={600}
                            size="lg"
                            component="a"
                            href={`#/teams/${encodeURIComponent(team.name)}`}
                            style={{
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(
                                `/teams/${encodeURIComponent(team.name)}`
                              );
                            }}
                            c="violet"
                          >
                            {team.name}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge variant="light" size="sm">
                            {team.content_type}
                          </Badge>
                          <Badge
                            variant="light"
                            size="sm"
                            color={FACTION_COLOR[team.faction as FactionName]}
                          >
                            {team.faction}
                          </Badge>
                          <Image
                            src={FACTION_ICON_MAP[team.faction as FactionName]}
                            alt={team.faction}
                            w={24}
                            h={24}
                          />
                          <Button
                            variant="light"
                            size="sm"
                            leftSection={<IoCreate size={14} />}
                            onClick={() => {
                              setEditData(team);
                              setMode('builder');
                            }}
                          >
                            Edit
                          </Button>
                        </Group>
                      </Group>

                      <Group gap="xs">
                        <Text size="sm" c="dimmed">
                          By {team.author}
                        </Text>
                        {team.description && (
                          <>
                            <Text size="sm" c="dimmed">
                              •
                            </Text>
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {team.description}
                            </Text>
                          </>
                        )}
                      </Group>

                      <SimpleGrid
                        cols={{ base: 3, xs: 4, sm: 6 }}
                        spacing={CHARACTER_GRID_SPACING}
                      >
                        {team.members.slice(0, 6).map((m) => {
                          const char = charMap.get(m.character_name);
                          return (
                            <div
                              key={m.character_name}
                              style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                              }}
                            >
                              <CharacterCard
                                name={m.character_name}
                                quality={char?.quality}
                                disableLink
                                note={m.note}
                              />
                              {m.overdrive_order != null && (
                                <Badge
                                  size="sm"
                                  circle
                                  variant="filled"
                                  color="orange"
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 'calc(50% - 40px)',
                                    pointerEvents: 'none',
                                  }}
                                >
                                  {m.overdrive_order}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </SimpleGrid>
                    </Stack>
                  </Paper>
                ))}

                <PaginationControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onChange={setCurrentPage}
                />
              </>
            )}

            {mode === 'builder' && (
              <TeamBuilder
                characters={characters}
                charMap={charMap}
                initialData={editData}
                wyrmspells={wyrmspells}
              />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
