import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { useMemo } from 'react';
import { IoCreate, IoFlash, IoInformationCircle } from 'react-icons/io5';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getArtifactIcon } from '../assets/artifacts';
import { getPortrait } from '../assets/character';
import { FACTION_WYRM_MAP } from '../assets/wyrms';
import ClassTag from '../components/common/ClassTag';
import DetailPageNavigation from '../components/common/DetailPageNavigation';
import EntityNotFound from '../components/common/EntityNotFound';
import FactionTag from '../components/common/FactionTag';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import QualityIcon from '../components/common/QualityIcon';
import RichText from '../components/common/RichText';
import WyrmspellCard from '../components/common/WyrmspellCard';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { DetailPageLoading } from '../components/layout/PageLoadingSkeleton';
import TeamSynergyAssistant from '../components/tools/TeamSynergyAssistant';
import { FACTION_COLOR, QUALITY_BORDER_COLOR } from '../constants/colors';
import { normalizeContentType } from '../constants/content-types';
import { GLASS_BORDER, getLoreGlassStyles } from '../constants/glass';
import {
  CURSOR_POINTER_STYLE,
  DETAIL_HERO_WRAPPER_STYLES,
  FLEX_1_STYLE,
  FLEX_SHRINK_0_STYLE,
  LINK_RESET_STYLE,
  RELATIVE_Z1_STYLE,
  getDetailHeroGradient,
  getHeroIconBoxStyles,
} from '../constants/styles';
import { TRANSITION } from '../constants/ui';
import { useDataFetch, useMobileTooltip } from '../hooks';
import type { Artifact } from '../types/artifact';
import type { Character } from '../types/character';
import type { Faction } from '../types/faction';
import type { StatusEffect } from '../types/status-effect';
import type { Team, TeamMember } from '../types/team';
import type { Wyrmspell } from '../types/wyrmspell';
import { computeTeamSynergy } from '../utils/team-synergy';

export default function TeamPage() {
  const tooltipProps = useMobileTooltip();
  const { teamName } = useParams<{ teamName: string }>();
  const isDark = useComputedColorScheme('light') === 'dark';
  const navigate = useNavigate();

  const { data: teams, loading: loadingTeams } = useDataFetch<Team[]>(
    'data/teams.json',
    []
  );
  const { data: characters, loading: loadingChars } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: wyrmspells, loading: loadingSpells } = useDataFetch<
    Wyrmspell[]
  >('data/wyrmspells.json', []);
  const { data: factions, loading: loadingFactions } = useDataFetch<Faction[]>(
    'data/factions.json',
    []
  );
  const { data: artifacts, loading: loadingArtifacts } = useDataFetch<
    Artifact[]
  >('data/artifacts.json', []);
  const { data: statusEffects, loading: loadingStatusEffects } = useDataFetch<
    StatusEffect[]
  >('data/status-effects.json', []);

  const loading =
    loadingTeams ||
    loadingChars ||
    loadingSpells ||
    loadingFactions ||
    loadingArtifacts ||
    loadingStatusEffects;

  const team = useMemo(() => {
    if (!teamName) return null;
    return teams.find((t) => t.name === decodeURIComponent(teamName));
  }, [teams, teamName]);

  // Match list page: preserve data file order (no sort)
  const orderedTeams = useMemo(() => [...teams], [teams]);

  const teamIndex = useMemo(() => {
    if (!team) return -1;
    return orderedTeams.findIndex(
      (entry) => entry.name.toLowerCase() === team.name.toLowerCase()
    );
  }, [orderedTeams, team]);

  const previousTeam = teamIndex > 0 ? orderedTeams[teamIndex - 1] : null;
  const nextTeam =
    teamIndex >= 0 && teamIndex < orderedTeams.length - 1
      ? orderedTeams[teamIndex + 1]
      : null;

  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(c.name, c);
    return map;
  }, [characters]);

  const factionInfo = useMemo(() => {
    if (!team) return null;
    return factions.find((f) => f.name === team.faction) ?? null;
  }, [factions, team]);

  const artifactMap = useMemo(() => {
    const map = new Map<string, Artifact>();
    for (const artifact of artifacts) map.set(artifact.name, artifact);
    return map;
  }, [artifacts]);

  const factionColor = team ? FACTION_COLOR[team.faction] : 'violet';

  const teamSynergy = useMemo(() => {
    if (!team) {
      return computeTeamSynergy({
        roster: [],
        faction: null,
        contentType: 'All',
        overdriveCount: 0,
        teamWyrmspells: {},
        wyrmspells,
      });
    }

    const roster = team.members
      .map((member) => charMap.get(member.character_name))
      .filter((character): character is Character => Boolean(character));

    return computeTeamSynergy({
      roster,
      faction: team.faction,
      contentType: normalizeContentType(team.content_type, 'All'),
      overdriveCount: team.members.filter(
        (member) => member.overdrive_order != null
      ).length,
      teamWyrmspells: team.wyrmspells || {},
      wyrmspells,
    });
  }, [team, charMap, wyrmspells]);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <DetailPageLoading />
      </Container>
    );
  }

  if (!team) {
    return (
      <EntityNotFound
        entityType="Team"
        name={teamName}
        backLabel="Back to Teams"
        backPath="/teams"
      />
    );
  }

  const hasWyrmspells =
    team.wyrmspells &&
    (team.wyrmspells.breach ||
      team.wyrmspells.refuge ||
      team.wyrmspells.wildcry ||
      team.wyrmspells.dragons_call);

  return (
    <Box>
      {/* Hero Section */}
      <Box style={DETAIL_HERO_WRAPPER_STYLES}>
        <Box style={getDetailHeroGradient(isDark, factionColor)} />

        <Container size="lg" style={RELATIVE_Z1_STYLE} py="xl">
          <Stack gap="lg">
            <Group justify="space-between">
              <Breadcrumbs
                items={[
                  { label: 'Teams', path: '/teams' },
                  { label: team.name },
                ]}
              />
              <Button
                variant="light"
                leftSection={<IoCreate size={14} />}
                onClick={() => {
                  navigate('/teams', { state: { editTeam: team } });
                }}
              >
                Edit Team
              </Button>
            </Group>

            <Group gap="lg" align="flex-start" wrap="nowrap">
              {/* Faction whelp image */}
              <Box style={getHeroIconBoxStyles(isDark, factionColor, true)}>
                <Image
                  src={FACTION_WYRM_MAP[team.faction]}
                  alt={`${team.faction} Whelp`}
                  w={64}
                  h={64}
                  fit="contain"
                />
              </Box>

              <Stack gap={6} style={FLEX_1_STYLE}>
                <Title
                  order={1}
                  c={isDark ? 'white' : 'dark'}
                  style={{ lineHeight: 1.2 }}
                >
                  {team.name}
                </Title>
                <Group gap="sm" align="center">
                  <Text size="sm" c="dimmed">
                    by{' '}
                    <Text span c="violet" inherit>
                      {team.author}
                    </Text>
                  </Text>
                  <LastUpdated timestamp={team.last_updated} />
                </Group>
                <Group gap="sm" mt={4}>
                  <FactionTag faction={team.faction} size="lg" />
                  <Badge size="lg" variant="outline" color="gray">
                    {normalizeContentType(team.content_type, 'All')}
                  </Badge>
                </Group>
              </Stack>
            </Group>

            {team.description && (
              <Paper p="md" radius="md" style={getLoreGlassStyles(isDark)}>
                <Text size="sm" lh={1.6}>
                  {team.description}
                </Text>
              </Paper>
            )}

            {factionInfo && (
              <Paper p="md" radius="md" style={getLoreGlassStyles(isDark)}>
                <Stack gap="sm">
                  <Title order={4}>Faction Overview</Title>
                  <RichText
                    text={factionInfo.description}
                    statusEffects={statusEffects}
                    lineHeight={1.6}
                  />
                  {factionInfo.recommended_artifacts.length > 0 && (
                    <Stack gap="xs" mt={4}>
                      <Text size="sm" fw={600}>
                        Recommended Artifacts
                      </Text>
                      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                        {factionInfo.recommended_artifacts.map(
                          (artifactName) => {
                            const iconSrc = getArtifactIcon(artifactName);
                            const artifact = artifactMap.get(artifactName);
                            return (
                              <Tooltip
                                key={artifactName}
                                label={artifactName}
                                {...tooltipProps}
                              >
                                <Link
                                  to={`/artifacts/${encodeURIComponent(artifactName)}`}
                                  style={LINK_RESET_STYLE}
                                >
                                  <Paper
                                    p="sm"
                                    radius="md"
                                    withBorder
                                    style={CURSOR_POINTER_STYLE}
                                  >
                                    <Group
                                      gap="sm"
                                      wrap="nowrap"
                                      align="flex-start"
                                    >
                                      <Box
                                        style={{
                                          width: 64,
                                          height: 64,
                                          borderRadius:
                                            'var(--mantine-radius-md)',
                                          background: isDark
                                            ? 'rgba(0,0,0,0.3)'
                                            : 'rgba(255,255,255,0.6)',
                                          border: isDark
                                            ? GLASS_BORDER.dark
                                            : GLASS_BORDER.light,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          ...FLEX_SHRINK_0_STYLE,
                                        }}
                                      >
                                        {iconSrc && (
                                          <Image
                                            src={iconSrc}
                                            alt={artifactName}
                                            w={52}
                                            h={52}
                                            fit="contain"
                                            radius="sm"
                                            loading="lazy"
                                          />
                                        )}
                                      </Box>
                                      <Stack gap={4} style={{ minWidth: 0 }}>
                                        <Text size="sm" fw={600} lineClamp={1}>
                                          {artifactName}
                                        </Text>
                                        <Group gap={6} align="center">
                                          {artifact?.quality && (
                                            <QualityIcon
                                              quality={artifact.quality}
                                              size={18}
                                            />
                                          )}
                                          {artifact && (
                                            <GlobalBadge
                                              isGlobal={artifact.is_global}
                                              size="xs"
                                            />
                                          )}
                                          {artifact && (
                                            <Text size="xs" c="dimmed">
                                              {artifact.rows}x{artifact.columns}
                                            </Text>
                                          )}
                                        </Group>
                                        {artifact && (
                                          <Text
                                            size="xs"
                                            c="dimmed"
                                            lineClamp={1}
                                          >
                                            {artifact.lore ||
                                              'No lore available.'}
                                          </Text>
                                        )}
                                      </Stack>
                                    </Group>
                                    {!artifact && (
                                      <Text size="xs" c="dimmed" mt={4}>
                                        Artifact info unavailable
                                      </Text>
                                    )}
                                  </Paper>
                                </Link>
                              </Tooltip>
                            );
                          }
                        )}
                      </SimpleGrid>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Stack gap="xl">
          <TeamSynergyAssistant synergy={teamSynergy} />

          {/* Wyrmspells Section */}
          {hasWyrmspells && (
            <Stack gap="md">
              <Title order={3}>Wyrmspells</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                {team.wyrmspells!.breach && (
                  <WyrmspellCard
                    name={team.wyrmspells!.breach}
                    type="Breach"
                    wyrmspells={wyrmspells}
                  />
                )}
                {team.wyrmspells!.refuge && (
                  <WyrmspellCard
                    name={team.wyrmspells!.refuge}
                    type="Refuge"
                    wyrmspells={wyrmspells}
                  />
                )}
                {team.wyrmspells!.wildcry && (
                  <WyrmspellCard
                    name={team.wyrmspells!.wildcry}
                    type="Wildcry"
                    wyrmspells={wyrmspells}
                  />
                )}
                {team.wyrmspells!.dragons_call && (
                  <WyrmspellCard
                    name={team.wyrmspells!.dragons_call}
                    type="Dragon's Call"
                    wyrmspells={wyrmspells}
                  />
                )}
              </SimpleGrid>
            </Stack>
          )}

          {/* Team Members */}
          <Stack gap="md">
            <Group gap="sm">
              <Title order={3}>Team Composition</Title>
              <Badge variant="light" color={factionColor} size="sm">
                {team.members.length} members
              </Badge>
            </Group>
            <BattlefieldGrid
              members={team.members}
              charMap={charMap}
              factionColor={factionColor}
              isDark={isDark}
              tooltipProps={tooltipProps}
            />

            {/* Bench */}
            {team.bench && team.bench.length > 0 && (
              <Stack gap="sm">
                <Group gap="sm">
                  <Title order={4}>Bench</Title>
                  <Badge variant="light" color={factionColor} size="sm">
                    {team.bench.length}
                  </Badge>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                  {team.bench.map((benchName) => {
                    const char = charMap.get(benchName);
                    const benchNote = team.bench_notes?.[benchName];
                    const borderColor = char
                      ? QUALITY_BORDER_COLOR[char.quality]
                      : 'var(--mantine-color-gray-5)';
                    return (
                      <Paper
                        key={benchName}
                        p="sm"
                        radius="md"
                        withBorder
                        style={{
                          borderTop: `3px solid var(--mantine-color-${factionColor}-5)`,
                        }}
                      >
                        <Stack gap={6} align="center">
                          <Box pos="relative">
                            <Tooltip
                              label={`View ${benchName}`}
                              {...tooltipProps}
                            >
                              <Link
                                to={`/characters/${encodeURIComponent(benchName)}`}
                              >
                                <Image
                                  src={getPortrait(benchName)}
                                  alt={benchName}
                                  w={72}
                                  h={72}
                                  fit="cover"
                                  radius="xl"
                                  loading="lazy"
                                  style={{
                                    border: `3px solid ${borderColor}`,
                                    borderRadius: '50%',
                                    transition: `filter ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                                  }}
                                />
                              </Link>
                            </Tooltip>
                          </Box>

                          <Text
                            fw={700}
                            size="sm"
                            ta="center"
                            component={Link}
                            to={`/characters/${encodeURIComponent(benchName)}`}
                            c="violet"
                            style={LINK_RESET_STYLE}
                            lineClamp={1}
                          >
                            {benchName}
                          </Text>

                          {char && (
                            <Group gap={4} justify="center" wrap="nowrap">
                              <QualityIcon quality={char.quality} size={16} />
                              <ClassTag
                                characterClass={char.character_class}
                                size="xs"
                              />
                            </Group>
                          )}

                          {char && (
                            <Group gap={4} justify="center" wrap="wrap">
                              {char.factions.map((f) => (
                                <FactionTag key={f} faction={f} size="xs" />
                              ))}
                            </Group>
                          )}

                          {benchNote && (
                            <>
                              <Divider style={{ width: '100%' }} />
                              <Group gap={4} wrap="nowrap" align="flex-start">
                                <IoInformationCircle
                                  size={12}
                                  color="var(--mantine-color-dimmed)"
                                  style={{ flexShrink: 0, marginTop: 2 }}
                                />
                                <Text
                                  size="xs"
                                  c="dimmed"
                                  fs="italic"
                                  lh={1.4}
                                  ta="center"
                                >
                                  {benchNote}
                                </Text>
                              </Group>
                            </>
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </SimpleGrid>
              </Stack>
            )}
          </Stack>
        </Stack>

        <DetailPageNavigation
          previousItem={
            previousTeam
              ? {
                  label: previousTeam.name,
                  path: `/teams/${encodeURIComponent(previousTeam.name)}`,
                }
              : null
          }
          nextItem={
            nextTeam
              ? {
                  label: nextTeam.name,
                  path: `/teams/${encodeURIComponent(nextTeam.name)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}

const BG_ROW_LABELS = ['Front', 'Middle', 'Back'] as const;
const BG_ROW_COLORS = ['red', 'orange', 'blue'] as const;
const BG_ROW_HINTS = [
  'Guardian · Warrior · Assassin',
  'Warrior · Priest · Mage · Archer · Assassin',
  'Priest · Mage · Archer · Assassin',
] as const;

function buildPositionGrid(members: TeamMember[]): (TeamMember | null)[][] {
  const grid: (TeamMember | null)[][] = Array.from({ length: 3 }, () =>
    Array(3).fill(null)
  );
  const unpositioned: TeamMember[] = [];
  for (const member of members) {
    if (member.position) {
      const { row, col } = member.position;
      if (row >= 0 && row < 3 && col >= 0 && col < 3) {
        grid[row][col] = member;
      } else {
        unpositioned.push(member);
      }
    } else {
      unpositioned.push(member);
    }
  }
  for (const member of unpositioned) {
    placed: for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!grid[r][c]) {
          grid[r][c] = member;
          break placed;
        }
      }
    }
  }
  return grid;
}

function BattlefieldGrid({
  members,
  charMap,
  factionColor,
  isDark,
  tooltipProps,
}: {
  members: TeamMember[];
  charMap: Map<string, Character>;
  factionColor: string;
  isDark: boolean;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}) {
  const grid = buildPositionGrid(members);
  const accentColor = `var(--mantine-color-${factionColor}-${isDark ? 7 : 5})`;

  return (
    <Stack gap="sm">
      {grid.map((row, rowIdx) => (
        <Group key={rowIdx} gap="sm" align="stretch" wrap="nowrap">
          {/* Row label */}
          <Tooltip label={BG_ROW_HINTS[rowIdx]} withArrow position="right">
            <Box
              style={{
                width: 52,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Text
                size="xs"
                fw={700}
                c={`${BG_ROW_COLORS[rowIdx]}.5`}
                ta="right"
                style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                {BG_ROW_LABELS[rowIdx]}
              </Text>
            </Box>
          </Tooltip>

          {/* 3 cells */}
          <SimpleGrid cols={3} spacing="sm" style={{ flex: 1 }}>
            {row.map((member, colIdx) => {
              if (!member) {
                return (
                  <Paper
                    key={colIdx}
                    radius="md"
                    withBorder
                    style={{
                      minHeight: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.25,
                      borderStyle: 'dashed',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      —
                    </Text>
                  </Paper>
                );
              }

              const character = charMap.get(member.character_name);
              const borderColor = character
                ? QUALITY_BORDER_COLOR[character.quality]
                : 'var(--mantine-color-gray-5)';

              return (
                <Paper
                  key={colIdx}
                  p="sm"
                  radius="md"
                  withBorder
                  style={{
                    borderTop: `3px solid ${accentColor}`,
                  }}
                >
                  <Stack gap={6} align="center">
                    {/* Portrait */}
                    <Box pos="relative">
                      <Tooltip
                        label={`View ${member.character_name}`}
                        {...tooltipProps}
                      >
                        <Link
                          to={`/characters/${encodeURIComponent(member.character_name)}`}
                        >
                          <Image
                            src={getPortrait(member.character_name)}
                            alt={member.character_name}
                            w={72}
                            h={72}
                            fit="cover"
                            radius="xl"
                            loading="lazy"
                            style={{
                              border: `3px solid ${borderColor}`,
                              borderRadius: '50%',
                              transition: `filter ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                            }}
                          />
                        </Link>
                      </Tooltip>
                      {member.overdrive_order != null && (
                        <Badge
                          size="md"
                          circle
                          variant="filled"
                          color={factionColor}
                          style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          {member.overdrive_order}
                        </Badge>
                      )}
                    </Box>

                    {/* Name */}
                    <Text
                      fw={700}
                      size="sm"
                      ta="center"
                      component={Link}
                      to={`/characters/${encodeURIComponent(member.character_name)}`}
                      c="violet"
                      style={LINK_RESET_STYLE}
                      lineClamp={1}
                    >
                      {member.character_name}
                    </Text>

                    {/* Class + Quality */}
                    {character && (
                      <Group gap={4} justify="center" wrap="nowrap">
                        <QualityIcon quality={character.quality} size={16} />
                        <ClassTag
                          characterClass={character.character_class}
                          size="xs"
                        />
                      </Group>
                    )}

                    {/* Factions */}
                    {character && (
                      <Group gap={4} justify="center" wrap="wrap">
                        {character.factions.map((f) => (
                          <FactionTag key={f} faction={f} size="xs" />
                        ))}
                      </Group>
                    )}

                    {/* Overdrive */}
                    {member.overdrive_order != null && (
                      <Group gap={4} justify="center">
                        <IoFlash
                          size={11}
                          color={`var(--mantine-color-${factionColor}-5)`}
                        />
                        <Text size="xs" c="dimmed">
                          Overdrive #{member.overdrive_order}
                        </Text>
                      </Group>
                    )}

                    {/* Note */}
                    {member.note && (
                      <>
                        <Divider style={{ width: '100%' }} />
                        <Group gap={4} wrap="nowrap" align="flex-start">
                          <IoInformationCircle
                            size={12}
                            color="var(--mantine-color-dimmed)"
                            style={{ flexShrink: 0, marginTop: 2 }}
                          />
                          <Text
                            size="xs"
                            c="dimmed"
                            fs="italic"
                            lh={1.4}
                            ta="center"
                          >
                            {member.note}
                          </Text>
                        </Group>
                      </>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Group>
      ))}
    </Stack>
  );
}
