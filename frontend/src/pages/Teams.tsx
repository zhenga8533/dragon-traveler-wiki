import {
  Badge,
  Button,
  Checkbox,
  Collapse,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { IoCreate, IoFilter, IoSearch } from 'react-icons/io5';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FACTION_ICON_MAP } from '../assets/faction';
import { FACTION_WYRM_MAP } from '../assets/wyrms';
import CharacterCard from '../components/CharacterCard';
import DataFetchError from '../components/DataFetchError';
import EmptyState from '../components/EmptyState';
import type { ChipFilterGroup } from '../components/EntityFilter';
import EntityFilter from '../components/EntityFilter';
import LastUpdated from '../components/LastUpdated';
import PaginationControl from '../components/PaginationControl';
import TeamBuilder from '../components/TeamBuilder';
import ViewToggle from '../components/ViewToggle';
import { FACTION_COLOR } from '../constants/colors';
import {
  CONTENT_TYPE_OPTIONS,
  normalizeContentType,
} from '../constants/content-types';
import { CARD_HOVER_STYLES, cardHoverHandlers } from '../constants/styles';
import { CHARACTER_GRID_SPACING, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useFilters, useViewMode } from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
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
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.TEAMS_SEARCH) || '';
  });
  const [mode, setMode] = useState<'view' | 'builder'>('view');
  const [editData, setEditData] = useState<Team | null>(null);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
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

  const activeCompareSelection = useMemo(
    () =>
      compareSelection.filter((teamName) =>
        teams.some((team) => team.name === teamName)
      ),
    [compareSelection, teams]
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
        !viewFilters.contentTypes.includes(
          normalizeContentType(team.content_type, 'All')
        )
      )
        return false;
      return true;
    });
  }, [teams, search, viewFilters]);

  const comparedTeams = useMemo(
    () =>
      activeCompareSelection
        .map((teamName) => teams.find((team) => team.name === teamName))
        .filter((team): team is Team => Boolean(team)),
    [activeCompareSelection, teams]
  );

  const compareSummary = useMemo(() => {
    if (comparedTeams.length !== 2) return null;
    const [firstTeam, secondTeam] = comparedTeams;
    const firstMembers = new Set(
      firstTeam.members.map((m) => m.character_name)
    );
    const secondMembers = new Set(
      secondTeam.members.map((m) => m.character_name)
    );

    const sharedMembers = [...firstMembers].filter((name) =>
      secondMembers.has(name)
    );
    const onlyFirst = [...firstMembers].filter(
      (name) => !secondMembers.has(name)
    );
    const onlySecond = [...secondMembers].filter(
      (name) => !firstMembers.has(name)
    );

    const getClassCounts = (team: Team) => {
      const counts = new Map<string, number>();
      for (const member of team.members) {
        const charClass = charMap.get(member.character_name)?.character_class;
        if (!charClass) continue;
        counts.set(charClass, (counts.get(charClass) || 0) + 1);
      }
      return counts;
    };

    const getTeamFactionSet = (team: Team) => {
      const factions = new Set<FactionName>();
      for (const member of team.members) {
        const character = charMap.get(member.character_name);
        if (!character) continue;
        for (const memberFaction of character.factions) {
          factions.add(memberFaction);
        }
      }
      // Keep the declared team faction as fallback if member lookup is incomplete.
      if (factions.size === 0) {
        factions.add(team.faction);
      }
      return factions;
    };

    const firstFactionSet = getTeamFactionSet(firstTeam);
    const secondFactionSet = getTeamFactionSet(secondTeam);
    const sharedFactions = [...firstFactionSet].filter((factionName) =>
      secondFactionSet.has(factionName)
    );

    return {
      sharedMembers,
      onlyFirst,
      onlySecond,
      firstOverdrive: firstTeam.members.filter((m) => m.overdrive_order != null)
        .length,
      secondOverdrive: secondTeam.members.filter(
        (m) => m.overdrive_order != null
      ).length,
      firstClasses: getClassCounts(firstTeam),
      secondClasses: getClassCounts(secondTeam),
      samePrimaryFaction: firstTeam.faction === secondTeam.faction,
      sharedFactions,
      sameContentType:
        normalizeContentType(firstTeam.content_type, 'All') ===
        normalizeContentType(secondTeam.content_type, 'All'),
    };
  }, [comparedTeams, charMap]);

  function toggleCompare(teamName: string) {
    setCompareSelection((prev) => {
      const validPrev = prev.filter((name) =>
        teams.some((team) => team.name === name)
      );
      if (validPrev.includes(teamName)) {
        return validPrev.filter((name) => name !== teamName);
      }
      if (validPrev.length >= 2) {
        return [validPrev[1], teamName];
      }
      return [...validPrev, teamName];
    });
  }

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

                <Paper p="sm" radius="md" withBorder>
                  <Stack gap="xs">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Text size="sm" fw={600}>
                        Compare Teams
                      </Text>
                      <Group gap="xs">
                        <Badge variant="light" size="sm" color="blue">
                          {activeCompareSelection.length} / 2 selected
                        </Badge>
                        <Button
                          variant="subtle"
                          size="compact-xs"
                          disabled={activeCompareSelection.length === 0}
                          onClick={() => setCompareSelection([])}
                        >
                          Clear
                        </Button>
                      </Group>
                    </Group>

                    <Text size="xs" c="dimmed">
                      Select up to 2 teams to compare roster overlap, class
                      coverage, overdrive setup, and metadata.
                    </Text>

                    {compareSummary && (
                      <>
                        <Divider />
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                          {comparedTeams.map((team, idx) => {
                            const classCounts =
                              idx === 0
                                ? compareSummary.firstClasses
                                : compareSummary.secondClasses;
                            const overdriveCount =
                              idx === 0
                                ? compareSummary.firstOverdrive
                                : compareSummary.secondOverdrive;
                            return (
                              <Paper
                                key={team.name}
                                p="sm"
                                radius="sm"
                                withBorder
                              >
                                <Stack gap={6}>
                                  <Group justify="space-between" wrap="nowrap">
                                    <Text fw={600} size="sm" lineClamp={1}>
                                      {team.name}
                                    </Text>
                                    <Button
                                      component={Link}
                                      to={`/teams/${encodeURIComponent(team.name)}`}
                                      variant="subtle"
                                      size="compact-xs"
                                    >
                                      Open
                                    </Button>
                                  </Group>
                                  <Group gap="xs">
                                    <Badge variant="light" size="xs">
                                      {normalizeContentType(
                                        team.content_type,
                                        'All'
                                      )}
                                    </Badge>
                                    <Badge
                                      variant="light"
                                      size="xs"
                                      color={
                                        FACTION_COLOR[
                                          team.faction as FactionName
                                        ]
                                      }
                                    >
                                      {team.faction}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      size="xs"
                                      color="orange"
                                    >
                                      OD {overdriveCount}
                                    </Badge>
                                  </Group>
                                  <Group gap="xs" wrap="wrap">
                                    {Array.from(classCounts.entries()).map(
                                      ([charClass, count]) => (
                                        <Badge
                                          key={`${team.name}-${charClass}`}
                                          variant="outline"
                                          size="xs"
                                          color="blue"
                                        >
                                          {charClass}: {count}
                                        </Badge>
                                      )
                                    )}
                                  </Group>
                                </Stack>
                              </Paper>
                            );
                          })}
                        </SimpleGrid>

                        <Group gap="xs" wrap="wrap">
                          <Badge
                            variant={
                              compareSummary.samePrimaryFaction
                                ? 'filled'
                                : 'light'
                            }
                            color={
                              compareSummary.samePrimaryFaction
                                ? 'teal'
                                : 'gray'
                            }
                          >
                            {compareSummary.samePrimaryFaction
                              ? 'Same primary faction'
                              : 'Different primary factions'}
                          </Badge>
                          <Badge
                            variant={
                              compareSummary.sharedFactions.length > 0
                                ? 'filled'
                                : 'light'
                            }
                            color={
                              compareSummary.sharedFactions.length > 0
                                ? 'teal'
                                : 'gray'
                            }
                          >
                            Shared member factions:{' '}
                            {compareSummary.sharedFactions.length}
                          </Badge>
                          <Badge
                            variant={
                              compareSummary.sameContentType
                                ? 'filled'
                                : 'light'
                            }
                            color={
                              compareSummary.sameContentType ? 'teal' : 'gray'
                            }
                          >
                            {compareSummary.sameContentType
                              ? 'Same content type'
                              : 'Different content types'}
                          </Badge>
                          <Badge variant="light" color="violet">
                            Shared members:{' '}
                            {compareSummary.sharedMembers.length}
                          </Badge>
                        </Group>

                        {compareSummary.sharedFactions.length > 0 && (
                          <Group gap="xs" wrap="wrap">
                            {compareSummary.sharedFactions.map(
                              (factionName) => (
                                <Badge
                                  key={`shared-faction-${factionName}`}
                                  variant="light"
                                  size="xs"
                                  color={FACTION_COLOR[factionName]}
                                >
                                  {factionName}
                                </Badge>
                              )
                            )}
                          </Group>
                        )}

                        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
                          <Paper p="xs" radius="sm" withBorder>
                            <Stack gap={4}>
                              <Text size="xs" fw={600}>
                                Shared
                              </Text>
                              {compareSummary.sharedMembers.length > 0 ? (
                                compareSummary.sharedMembers.map((name) => (
                                  <Text key={name} size="xs" c="dimmed">
                                    • {name}
                                  </Text>
                                ))
                              ) : (
                                <Text size="xs" c="dimmed">
                                  No shared members
                                </Text>
                              )}
                            </Stack>
                          </Paper>
                          <Paper p="xs" radius="sm" withBorder>
                            <Stack gap={4}>
                              <Text size="xs" fw={600}>
                                Only in {comparedTeams[0].name}
                              </Text>
                              {compareSummary.onlyFirst.length > 0 ? (
                                compareSummary.onlyFirst.map((name) => (
                                  <Text key={name} size="xs" c="dimmed">
                                    • {name}
                                  </Text>
                                ))
                              ) : (
                                <Text size="xs" c="dimmed">
                                  None
                                </Text>
                              )}
                            </Stack>
                          </Paper>
                          <Paper p="xs" radius="sm" withBorder>
                            <Stack gap={4}>
                              <Text size="xs" fw={600}>
                                Only in {comparedTeams[1].name}
                              </Text>
                              {compareSummary.onlySecond.length > 0 ? (
                                compareSummary.onlySecond.map((name) => (
                                  <Text key={name} size="xs" c="dimmed">
                                    • {name}
                                  </Text>
                                ))
                              ) : (
                                <Text size="xs" c="dimmed">
                                  None
                                </Text>
                              )}
                            </Stack>
                          </Paper>
                        </SimpleGrid>
                      </>
                    )}
                  </Stack>
                </Paper>

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

                {viewMode === 'grid' ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {paginatedTeams.map((team) =>
                      (() => {
                        const isSelectedForCompare = compareSelection.includes(
                          team.name
                        );
                        const compareDisabled =
                          !isSelectedForCompare &&
                          activeCompareSelection.length >= 2;
                        return (
                          <Paper
                            key={team.name}
                            p="md"
                            radius="md"
                            withBorder
                            style={{
                              ...CARD_HOVER_STYLES,
                              textDecoration: 'none',
                              color: 'inherit',
                              display: 'block',
                            }}
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
                            {...cardHoverHandlers}
                          >
                            <Stack gap="sm">
                              <Group
                                justify="space-between"
                                align="flex-start"
                                wrap="wrap"
                              >
                                <Group gap="sm">
                                  <Image
                                    src={
                                      FACTION_WYRM_MAP[
                                        team.faction as FactionName
                                      ]
                                    }
                                    alt={`${team.faction} Whelp`}
                                    w={40}
                                    h={40}
                                    fit="contain"
                                  />
                                  <Text fw={600} size="lg" c="violet">
                                    {team.name}
                                  </Text>
                                </Group>

                                <Group gap="xs">
                                  <Checkbox
                                    label="Compare"
                                    size="xs"
                                    checked={isSelectedForCompare}
                                    disabled={compareDisabled}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleCompare(team.name);
                                    }}
                                  />
                                  <Button
                                    variant="light"
                                    size="sm"
                                    leftSection={<IoCreate size={14} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditData(team);
                                      setMode('builder');
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </Group>
                              </Group>

                              <Group gap="xs">
                                <Badge variant="light" size="sm">
                                  {normalizeContentType(
                                    team.content_type,
                                    'All'
                                  )}
                                </Badge>
                                <Badge
                                  variant="light"
                                  size="sm"
                                  color={
                                    FACTION_COLOR[team.faction as FactionName]
                                  }
                                >
                                  {team.faction}
                                </Badge>
                                <Image
                                  src={
                                    FACTION_ICON_MAP[
                                      team.faction as FactionName
                                    ]
                                  }
                                  alt={team.faction}
                                  w={24}
                                  h={24}
                                />
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
                                cols={{ base: 3, xs: 4, sm: 3 }}
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
                        );
                      })()
                    )}
                  </SimpleGrid>
                ) : (
                  <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                    <Table striped highlightOnHover style={{ minWidth: 500 }}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Compare</Table.Th>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Faction</Table.Th>
                          <Table.Th>Content Type</Table.Th>
                          <Table.Th>Author</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedTeams.map((team) => (
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
                              <Checkbox
                                size="xs"
                                checked={compareSelection.includes(team.name)}
                                disabled={
                                  !compareSelection.includes(team.name) &&
                                  activeCompareSelection.length >= 2
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleCompare(team.name);
                                }}
                              />
                            </Table.Td>
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
                              <Group gap="xs" wrap="nowrap">
                                <Image
                                  src={
                                    FACTION_ICON_MAP[
                                      team.faction as FactionName
                                    ]
                                  }
                                  alt={team.faction}
                                  w={20}
                                  h={20}
                                  fit="contain"
                                />
                                <Text size="sm">{team.faction}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" size="sm">
                                {normalizeContentType(team.content_type, 'All')}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{team.author}</Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
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
