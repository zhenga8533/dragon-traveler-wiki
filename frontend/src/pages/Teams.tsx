import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Collapse,
  Container,
  Group,
  Image,
  Paper,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { IoCreate, IoFilter } from 'react-icons/io5';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FACTION_ICON_MAP } from '../assets/faction';
import { FACTION_WYRM_MAP } from '../assets/wyrms';
import CharacterPortrait from '../components/character/CharacterPortrait';
import DataFetchError from '../components/common/DataFetchError';
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import EntityFilter from '../components/common/EntityFilter';
import FactionTag from '../components/common/FactionTag';
import LastUpdated from '../components/common/LastUpdated';
import NoResultsSuggestions from '../components/common/NoResultsSuggestions';
import PaginationControl from '../components/common/PaginationControl';
import ViewToggle from '../components/common/ViewToggle';
import {
  ListPageLoading,
  ViewModeLoading,
} from '../components/layout/PageLoadingSkeleton';
import TeamBuilder from '../components/tools/TeamBuilder';
import { FACTION_COLOR, FACTION_NAMES } from '../constants/colors';
import {
  CONTENT_TYPE_OPTIONS,
  normalizeContentType,
} from '../constants/content-types';
import {
  getCardHoverProps,
  getMinWidthStyle,
  LINK_BLOCK_RESET_STYLE,
} from '../constants/styles';
import { STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks';
import { useFilters, useViewMode } from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
import type { Character } from '../types/character';
import type { FactionName } from '../types/faction';
import type { Team } from '../types/team';
import type { Wyrmspell } from '../types/wyrmspell';

const TEAMS_PER_PAGE = 12;

function TeamCharacterAvatars({
  names,
  charMap,
  size,
  isSubstitute = false,
  layout = 'wrap',
  columns = 3,
  gap = 4,
  wrap = 'wrap',
}: {
  names: string[];
  charMap: Map<string, Character>;
  size: number;
  isSubstitute?: boolean;
  layout?: 'wrap' | 'grid';
  columns?: number;
  gap?: number;
  wrap?: 'wrap' | 'nowrap';
}) {
  const portraits = names.map((name) => {
    const char = charMap.get(name);
    return (
      <CharacterPortrait
        key={`${isSubstitute ? 'sub' : 'main'}-${name}`}
        name={name}
        size={size}
        quality={char?.quality}
        isSubstitute={isSubstitute}
        tooltip={isSubstitute ? `${name} (Sub)` : name}
      />
    );
  });

  if (layout === 'grid') {
    return (
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, ${size}px)`,
          gap: 6,
        }}
      >
        {portraits}
      </Box>
    );
  }

  return (
    <Group gap={gap} wrap={wrap}>
      {portraits}
    </Group>
  );
}

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
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.TEAMS_SEARCH) || '';
  });
  const [mode, setMode] = useState<'view' | 'builder'>('view');
  const [editData, setEditData] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TEAMS_VIEW_MODE,
    defaultMode: 'grid',
  });
  const isLargeTeamCardLayout = useMediaQuery('(min-width: 75em)');
  const loading = loadingTeams || loadingChars || loadingSpells;
  const error = teamsError || charactersError || wyrmspellsError;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.TEAMS_SEARCH, search);
  }, [search]);

  // Handle edit state from navigation
  useEffect(() => {
    if (location.state?.editTeam) {
      queueMicrotask(() => {
        setEditData(location.state.editTeam);
        setMode('builder');
      });
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(c.name, c);
    return map;
  }, [characters]);

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
    mode === 'view'
      ? viewFilters.factions.length +
        viewFilters.contentTypes.length +
        (search.trim() ? 1 : 0)
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
        !viewFilters.contentTypes.includes(
          normalizeContentType(team.content_type, 'All')
        )
      )
        return false;
      return true;
    });
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
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Teams</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <Group gap="xs">
            {mode === 'view' && (
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
          (mode === 'view' ? (
            <ViewModeLoading viewMode={viewMode} cards={4} cardHeight={200} />
          ) : (
            <ListPageLoading cards={4} />
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
                <Paper
                  p="sm"
                  radius="md"
                  withBorder
                  bg="var(--mantine-color-body)"
                >
                  <EntityFilter
                    groups={entityFilterGroups}
                    selected={viewFilters}
                    onChange={(key, values) =>
                      setViewFilters((prev) => ({ ...prev, [key]: values }))
                    }
                    onClear={() => {
                      setViewFilters({ factions: [], contentTypes: [] });
                      setSearch('');
                    }}
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search teams..."
                  />
                </Paper>
              </Collapse>
            )}

            {mode === 'view' && (
              <>
                {filteredTeams.length === 0 && (
                  <NoResultsSuggestions
                    title={search ? 'No teams found' : 'No matching teams'}
                    message={
                      search
                        ? 'No teams match your search.'
                        : 'No teams match the current filters.'
                    }
                    onReset={() => {
                      setViewFilters({ factions: [], contentTypes: [] });
                      setSearch('');
                    }}
                    onOpenFilters={toggleFilter}
                  />
                )}

                {viewMode === 'grid' ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {paginatedTeams.map((team) =>
                      (() => {
                        return (
                          <Paper
                            key={team.name}
                            p="md"
                            radius="md"
                            withBorder
                            {...getCardHoverProps({
                              interactive: true,
                              style: {
                                ...LINK_BLOCK_RESET_STYLE,
                                borderTop: `3px solid var(--mantine-color-${FACTION_COLOR[team.faction as FactionName] ?? 'violet'}-5)`,
                              },
                            })}
                            onClick={() =>
                              navigate(
                                `/teams/${encodeURIComponent(team.name)}`
                              )
                            }
                            role="link"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                navigate(
                                  `/teams/${encodeURIComponent(team.name)}`
                                );
                              }
                            }}
                          >
                            <Stack gap="sm">
                              {/* Header: whelp + name + edit icon */}
                              <Group
                                justify="space-between"
                                align="flex-start"
                                wrap="nowrap"
                                gap="xs"
                              >
                                <Group
                                  gap="xs"
                                  wrap="nowrap"
                                  style={{ minWidth: 0 }}
                                >
                                  <Image
                                    src={
                                      FACTION_WYRM_MAP[
                                        team.faction as FactionName
                                      ]
                                    }
                                    alt={`${team.faction} Whelp`}
                                    w={32}
                                    h={32}
                                    fit="contain"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <Text
                                    fw={700}
                                    size="md"
                                    c="violet"
                                    lineClamp={1}
                                  >
                                    {team.name}
                                  </Text>
                                </Group>
                                <Tooltip label="Edit in builder" withArrow>
                                  <ActionIcon
                                    variant="subtle"
                                    size="md"
                                    color="violet"
                                    style={{ flexShrink: 0 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditData(team);
                                      setMode('builder');
                                    }}
                                    aria-label="Edit team"
                                  >
                                    <IoCreate size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>

                              {/* Tags */}
                              <Group gap="xs">
                                <FactionTag
                                  faction={team.faction as FactionName}
                                  size="sm"
                                />
                                <Badge variant="light" size="sm" color="gray">
                                  {normalizeContentType(
                                    team.content_type,
                                    'All'
                                  )}
                                </Badge>
                              </Group>

                              {/* Author + description */}
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                by{' '}
                                <Text span c="violet" fw={500} inherit>
                                  {team.author}
                                </Text>
                                {team.description && (
                                  <Text span inherit>
                                    {' '}
                                    · {team.description}
                                  </Text>
                                )}
                              </Text>

                              {/* Member portraits */}
                              <Stack gap={4}>
                                <Group gap={6} align="flex-start" wrap="nowrap">
                                  <Badge size="xs" variant="light" color="blue">
                                    Main {team.members.length}
                                  </Badge>
                                  <TeamCharacterAvatars
                                    names={team.members.map(
                                      (member) => member.character_name
                                    )}
                                    charMap={charMap}
                                    size={isLargeTeamCardLayout ? 64 : 56}
                                    layout="wrap"
                                    gap={isLargeTeamCardLayout ? 6 : 4}
                                    wrap={
                                      isLargeTeamCardLayout ? 'nowrap' : 'wrap'
                                    }
                                  />
                                </Group>
                                {(team.bench?.length ?? 0) > 0 && (
                                  <Group
                                    gap={6}
                                    align="flex-start"
                                    wrap="nowrap"
                                  >
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      color="gray"
                                    >
                                      Subs {team.bench!.length}
                                    </Badge>
                                    <TeamCharacterAvatars
                                      names={team.bench!}
                                      charMap={charMap}
                                      size={isLargeTeamCardLayout ? 52 : 44}
                                      isSubstitute
                                      layout="wrap"
                                      gap={isLargeTeamCardLayout ? 6 : 4}
                                      wrap={
                                        isLargeTeamCardLayout
                                          ? 'nowrap'
                                          : 'wrap'
                                      }
                                    />
                                  </Group>
                                )}
                              </Stack>
                            </Stack>
                          </Paper>
                        );
                      })()
                    )}
                  </SimpleGrid>
                ) : (
                  <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                    <Table
                      striped
                      highlightOnHover
                      style={getMinWidthStyle(640)}
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Members</Table.Th>
                          <Table.Th>Faction</Table.Th>
                          <Table.Th>Content Type</Table.Th>
                          <Table.Th>Author</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedTeams.map((team) => {
                          return (
                            <Table.Tr
                              key={team.name}
                              style={{ cursor: 'pointer' }}
                              onClick={() =>
                                navigate(
                                  `/teams/${encodeURIComponent(team.name)}`
                                )
                              }
                            >
                              <Table.Td>
                                <Group gap="sm" wrap="nowrap">
                                  <Image
                                    src={
                                      FACTION_WYRM_MAP[
                                        team.faction as FactionName
                                      ]
                                    }
                                    alt={`${team.faction} Whelp`}
                                    w={28}
                                    h={28}
                                    fit="contain"
                                  />
                                  <Text
                                    component={Link}
                                    to={`/teams/${encodeURIComponent(team.name)}`}
                                    size="sm"
                                    fw={500}
                                    c="violet"
                                    style={{ textDecoration: 'none' }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {team.name}
                                  </Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Stack gap={4}>
                                  <Group gap={6} align="center" wrap="nowrap">
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      color="blue"
                                    >
                                      Main
                                    </Badge>
                                    <TeamCharacterAvatars
                                      names={team.members.map(
                                        (member) => member.character_name
                                      )}
                                      charMap={charMap}
                                      size={32}
                                    />
                                  </Group>
                                  {(team.bench?.length ?? 0) > 0 && (
                                    <Group gap={6} align="center" wrap="nowrap">
                                      <Badge
                                        size="xs"
                                        variant="light"
                                        color="gray"
                                      >
                                        Subs
                                      </Badge>
                                      <TeamCharacterAvatars
                                        names={team.bench!}
                                        charMap={charMap}
                                        size={32}
                                        isSubstitute
                                      />
                                    </Group>
                                  )}
                                </Stack>
                              </Table.Td>
                              <Table.Td>
                                <FactionTag
                                  faction={team.faction as FactionName}
                                  size="sm"
                                />
                              </Table.Td>
                              <Table.Td>
                                <Badge variant="light" size="sm">
                                  {normalizeContentType(
                                    team.content_type,
                                    'All'
                                  )}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="violet">
                                  {team.author}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                )}

                <PaginationControl
                  currentPage={page}
                  totalPages={totalPages}
                  onChange={setPage}
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
