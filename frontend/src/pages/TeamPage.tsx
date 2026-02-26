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
import {
  IoCreate,
  IoFlash,
  IoInformationCircle,
  IoSwapHorizontal,
} from 'react-icons/io5';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getArtifactIcon } from '../assets/artifacts';
import { getPortrait } from '../assets/character';
import { FACTION_ICON_MAP } from '../assets/faction';
import { QUALITY_ICON_MAP } from '../assets/quality';
import { FACTION_WYRM_MAP } from '../assets/wyrms';
import { QUALITY_BORDER_COLOR } from '../constants/colors';
import ClassLabel from '../components/common/ClassLabel';
import EntityNotFound from '../components/common/EntityNotFound';
import QualityIcon from '../components/common/QualityIcon';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import RichText from '../components/common/RichText';
import WyrmspellCard from '../components/common/WyrmspellCard';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { DetailPageLoading } from '../components/layout/PageLoadingSkeleton';
import TeamSynergyAssistant from '../components/tools/TeamSynergyAssistant';
import { FACTION_COLOR } from '../constants/colors';
import { normalizeContentType } from '../constants/content-types';
import { CARD_HOVER_STYLES, cardHoverHandlers } from '../constants/styles';
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

  // FACTION_COLOR values like 'purple' and 'black' aren't valid Mantine color
  // scale names, so map them to the closest Mantine equivalents for CSS vars.
  const MANTINE_COLOR_MAP: Record<string, string> = {
    purple: 'grape',
    black: 'gray',
  };
  const rawFactionColor = team ? FACTION_COLOR[team.faction] : 'violet';
  const factionColor = MANTINE_COLOR_MAP[rawFactionColor] ?? rawFactionColor;

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
      <Box
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--mantine-color-body)',
          margin:
            'calc(-1 * var(--mantine-spacing-md)) calc(-1 * var(--mantine-spacing-md)) 0',
          padding: 'var(--mantine-spacing-md) var(--mantine-spacing-md) 0',
        }}
      >
        {/* Faction-colored gradient background */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? `radial-gradient(ellipse at 30% 20%, var(--mantine-color-${factionColor}-9) 0%, transparent 50%),
                 radial-gradient(ellipse at 70% 80%, var(--mantine-color-violet-9) 0%, transparent 50%),
                 var(--mantine-color-dark-8)`
              : `radial-gradient(ellipse at 30% 20%, var(--mantine-color-${factionColor}-1) 0%, transparent 50%),
                 radial-gradient(ellipse at 70% 80%, var(--mantine-color-violet-1) 0%, transparent 50%),
                 var(--mantine-color-gray-0)`,
            opacity: isDark ? 0.7 : 0.9,
          }}
        />

        <Container
          size="lg"
          style={{ position: 'relative', zIndex: 1 }}
          py="xl"
        >
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
              <Box
                style={{
                  width: 96,
                  height: 96,
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: isDark
                    ? `rgba(0,0,0,0.3)`
                    : `rgba(255,255,255,0.5)`,
                  border: `3px solid var(--mantine-color-${factionColor}-${isDark ? 7 : 4})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 24px var(--mantine-color-${factionColor}-${isDark ? 9 : 2})`,
                }}
              >
                <Image
                  src={FACTION_WYRM_MAP[team.faction]}
                  alt={`${team.faction} Whelp`}
                  w={64}
                  h={64}
                  fit="contain"
                />
              </Box>

              <Stack gap={6} style={{ flex: 1 }}>
                <Title
                  order={1}
                  c={isDark ? 'white' : 'dark'}
                  style={{ lineHeight: 1.2 }}
                >
                  {team.name}
                </Title>
                <Group gap="sm" align="center">
                  <Text size="sm" c="dimmed">
                    by {team.author}
                  </Text>
                  <LastUpdated timestamp={team.last_updated} />
                </Group>
                <Group gap="sm" mt={4}>
                  <Badge
                    size="lg"
                    variant="light"
                    color={factionColor}
                    leftSection={
                      <Image
                        src={FACTION_ICON_MAP[team.faction]}
                        alt={team.faction}
                        w={16}
                        h={16}
                        fit="contain"
                      />
                    }
                  >
                    {team.faction}
                  </Badge>
                  <Badge size="lg" variant="outline" color="gray">
                    {normalizeContentType(team.content_type, 'All')}
                  </Badge>
                </Group>
              </Stack>
            </Group>

            {team.description && (
              <Paper
                p="md"
                radius="md"
                style={{
                  background: isDark
                    ? 'rgba(0,0,0,0.25)'
                    : 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(8px)',
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <Text size="sm" lh={1.6}>
                  {team.description}
                </Text>
              </Paper>
            )}

            {factionInfo && (
              <Paper
                p="md"
                radius="md"
                style={{
                  background: isDark
                    ? 'rgba(0,0,0,0.25)'
                    : 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(8px)',
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(0,0,0,0.06)',
                }}
              >
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
                                  style={{ textDecoration: 'none' }}
                                >
                                  <Paper
                                    p="sm"
                                    radius="md"
                                    withBorder
                                    style={{
                                      cursor: 'pointer',
                                    }}
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
                                          borderRadius: 10,
                                          background: isDark
                                            ? 'rgba(0,0,0,0.3)'
                                            : 'rgba(255,255,255,0.6)',
                                          border: isDark
                                            ? '1px solid rgba(255,255,255,0.08)'
                                            : '1px solid rgba(0,0,0,0.08)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
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
                                            <Image
                                              src={
                                                QUALITY_ICON_MAP[
                                                  artifact.quality
                                                ]
                                              }
                                              alt={artifact.quality}
                                              h={18}
                                              w="auto"
                                              fit="contain"
                                              style={{ display: 'block' }}
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
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {team.members.map((member) => (
                <TeamMemberCard
                  key={member.character_name}
                  member={member}
                  charMap={charMap}
                  factionColor={factionColor}
                  isDark={isDark}
                  tooltipProps={tooltipProps}
                />
              ))}
            </SimpleGrid>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function TeamMemberCard({
  member,
  charMap,
  factionColor,
  isDark,
  tooltipProps,
}: {
  member: TeamMember;
  charMap: Map<string, Character>;
  factionColor: string;
  isDark: boolean;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}) {
  const character = charMap.get(member.character_name);
  const borderColor = character
    ? QUALITY_BORDER_COLOR[character.quality]
    : 'var(--mantine-color-gray-5)';
  const hasSubstitutes =
    Array.isArray(member.substitutes) && member.substitutes.length > 0;

  return (
    <Paper
      p="lg"
      radius="md"
      withBorder
      style={{
        ...CARD_HOVER_STYLES,
        borderTop: `3px solid var(--mantine-color-${factionColor}-${isDark ? 7 : 5})`,
      }}
      {...cardHoverHandlers}
    >
      <Group gap="md" wrap="nowrap" align="flex-start">
        {/* Portrait */}
        <Box pos="relative" style={{ flexShrink: 0 }}>
          <Tooltip label={`View ${member.character_name}`} {...tooltipProps}>
            <Link
              to={`/characters/${encodeURIComponent(member.character_name)}`}
            >
              <Image
                src={getPortrait(member.character_name)}
                alt={member.character_name}
                h={100}
                w={100}
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
          {member.overdrive_order && (
            <Badge
              size="lg"
              circle
              variant="filled"
              color={factionColor}
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              {member.overdrive_order}
            </Badge>
          )}
        </Box>

        {/* Info */}
        <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
          <Text
            fw={700}
            size="md"
            component={Link}
            to={`/characters/${encodeURIComponent(member.character_name)}`}
            c="violet"
            style={{ textDecoration: 'none' }}
          >
            {member.character_name}
          </Text>

          {character && (
            <>
              <Group gap={6} align="center">
                <QualityIcon quality={character.quality} size={18} />
                <Badge size="sm" variant="outline" color="gray">
                  <ClassLabel characterClass={character.character_class} />
                </Badge>
              </Group>
              <Group gap={4} wrap="wrap">
                {character.factions.map((faction) => (
                  <Badge
                    key={faction}
                    size="sm"
                    variant="light"
                    leftSection={
                      <Image
                        src={FACTION_ICON_MAP[faction]}
                        alt={faction}
                        w={12}
                        h={12}
                        fit="contain"
                      />
                    }
                  >
                    {faction}
                  </Badge>
                ))}
              </Group>
            </>
          )}

          {member.overdrive_order && (
            <Group gap={4}>
              <IoFlash
                size={12}
                color={`var(--mantine-color-${factionColor}-5)`}
              />
              <Text size="xs" c="dimmed">
                Overdrive #{member.overdrive_order}
              </Text>
            </Group>
          )}

          <Box mt={4}>
            <Group gap={4} mb={4}>
              <IoSwapHorizontal size={12} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed" fw={500}>
                Substitutes
              </Text>
            </Group>

            {hasSubstitutes ? (
              <Group gap="xs">
                {member.substitutes!.map((sub) => (
                  <Tooltip key={sub} label={sub} {...tooltipProps}>
                    <Link
                      to={`/characters/${encodeURIComponent(sub)}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Image
                        src={getPortrait(sub)}
                        alt={sub}
                        h={36}
                        w={36}
                        fit="cover"
                        radius="xl"
                        loading="lazy"
                        style={{
                          border: `2px solid ${charMap.get(sub) ? QUALITY_BORDER_COLOR[charMap.get(sub)!.quality] : 'var(--mantine-color-gray-5)'}`,
                          borderRadius: '50%',
                          transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                    </Link>
                  </Tooltip>
                ))}
              </Group>
            ) : (
              <Text size="xs" c="dimmed">
                No substitutes
              </Text>
            )}
          </Box>

          {member.note && (
            <>
              <Divider mt={4} />
              <Group gap={6} wrap="nowrap" align="flex-start">
                <IoInformationCircle
                  size={14}
                  color="var(--mantine-color-dimmed)"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <Text size="xs" c="dimmed" fs="italic" lh={1.4}>
                  {member.note}
                </Text>
              </Group>
            </>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
