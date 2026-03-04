import {
  ActionIcon,
  Badge,
  Box,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Title,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { toPng } from 'html-to-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IoDownload } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import ChangeHistory from '../../components/common/ChangeHistory';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import DetailPageNavigation from '../../components/common/DetailPageNavigation';
import EntityNotFound from '../../components/common/EntityNotFound';
import WyrmspellCard from '../../components/common/WyrmspellCard';
import { DetailPageLoading } from '../../components/layout/PageLoadingSkeleton';
import TeamSynergyAssistant from '../../components/tools/TeamSynergyAssistant';
import { FACTION_COLOR } from '../../constants/colors';
import { normalizeContentType } from '../../constants/content-types';
import { STORAGE_KEY } from '../../constants/ui';
import { useCharacterResolution, useMobileTooltip } from '../../hooks';
import {
  useArtifacts,
  useCharacters,
  useFactions,
  useStatusEffects,
  useTeamChanges,
  useTeams,
  useWyrmspells,
} from '../../hooks/use-common-data';
import type { Artifact } from '../../types/artifact';
import type { Character } from '../../types/character';
import {
  getCharacterRoutePath,
  getCharacterRoutePathByName,
  resolveCharacterByNameAndQuality,
} from '../../utils/character-route';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
  toEntitySlug,
} from '../../utils/entity-slug';
import { computeTeamSynergy } from '../../utils/team-synergy';
import { BattlefieldGrid } from './BattlefieldGrid';
import { BenchSection } from './BenchSection';
import { TeamHeroSection } from './HeroSection';

export default function TeamPage() {
  const tooltipProps = useMobileTooltip();
  const { teamName } = useParams<{ teamName: string }>();
  const isDark = useComputedColorScheme('light') === 'dark';
  const navigate = useNavigate();
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const { data: teams, loading: loadingTeams } = useTeams();
  const { data: characters, loading: loadingChars } = useCharacters();
  const { data: wyrmspells, loading: loadingSpells } = useWyrmspells();
  const { data: factions, loading: loadingFactions } = useFactions();
  const { data: artifacts, loading: loadingArtifacts } = useArtifacts();
  const { data: statusEffects, loading: loadingStatusEffects } = useStatusEffects();
  const { data: changesData } = useTeamChanges();

  const loading =
    loadingTeams ||
    loadingChars ||
    loadingSpells ||
    loadingFactions ||
    loadingArtifacts ||
    loadingStatusEffects;

  const team = useMemo(() => {
    return findEntityByParam(teams, teamName, (t) => t.name);
  }, [teams, teamName]);

  useEffect(() => {
    if (!team || !teamName) return;
    if (!shouldRedirectToEntitySlug(teamName, team.name)) return;
    navigate(`/teams/${toEntitySlug(team.name)}`, { replace: true });
  }, [navigate, team, teamName]);

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

  const { preferredByName: charMap, byIdentity: characterByIdentity, nameCounts: characterNameCounts } =
    useCharacterResolution(characters);

  const getCharacterPath = useCallback(
    (characterName: string, characterQuality?: string | null) => {
      const character = resolveCharacterByNameAndQuality(
        characterName,
        characterQuality,
        charMap,
        characterByIdentity
      );
      if (!character) return getCharacterRoutePathByName(characterName);
      return getCharacterRoutePath(character, characterNameCounts);
    },
    [charMap, characterByIdentity, characterNameCounts]
  );

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
      .map((member) =>
        resolveCharacterByNameAndQuality(
          member.character_name,
          member.character_quality,
          charMap,
          characterByIdentity
        )
      )
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
  }, [team, charMap, characterByIdentity, wyrmspells]);

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

  const hasBuilderDraft = () => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.localStorage.getItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT)
    );
  };

  const openEditInBuilder = () => {
    navigate('/teams', { state: { editTeam: team } });
  };

  const requestEdit = () => {
    if (!hasBuilderDraft()) {
      openEditInBuilder();
      return;
    }
    setConfirmEditOpen(true);
  };

  const exportAsImage = async () => {
    if (!exportRef.current || !team) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${team.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <TeamHeroSection
        team={team}
        factionInfo={factionInfo}
        artifactMap={artifactMap}
        statusEffects={statusEffects}
        isDark={isDark}
        tooltipProps={tooltipProps}
        onRequestEdit={requestEdit}
      />

      <ConfirmActionModal
        opened={confirmEditOpen}
        onCancel={() => setConfirmEditOpen(false)}
        title="Replace current builder data?"
        message="Opening this team will replace your current builder draft."
        confirmLabel="Replace"
        onConfirm={() => {
          setConfirmEditOpen(false);
          openEditInBuilder();
        }}
      />

      <Container size="lg" py="xl">
        <Stack gap="xl">
          <TeamSynergyAssistant synergy={teamSynergy} />

          {hasWyrmspells && (
            <Stack gap="md">
              <Title order={2} size="h3">
                Wyrmspells
              </Title>
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

          <Stack gap="md">
            <Group gap="sm" justify="space-between">
              <Group gap="sm">
                <Title order={2} size="h3">
                  Team Composition
                </Title>
                <Badge variant="light" color={factionColor} size="sm">
                  {team.members.length} members
                </Badge>
              </Group>
              <Tooltip label="Export as image" withArrow>
                <ActionIcon
                  variant="subtle"
                  color={factionColor}
                  size="lg"
                  loading={exporting}
                  onClick={exportAsImage}
                >
                  <IoDownload size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Box ref={exportRef} style={{ padding: 8 }}>
              <Stack gap="md">
                <BattlefieldGrid
                  members={team.members}
                  charMap={charMap}
                  characterByIdentity={characterByIdentity}
                  getCharacterPath={getCharacterPath}
                  factionColor={factionColor}
                  isDark={isDark}
                  tooltipProps={tooltipProps}
                />

                {team.bench && team.bench.length > 0 && (
                  <BenchSection
                    bench={team.bench}
                    charMap={charMap}
                    characterByIdentity={characterByIdentity}
                    getCharacterPath={getCharacterPath}
                    factionColor={factionColor}
                    tooltipProps={tooltipProps}
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Stack>

        <ChangeHistory history={changesData[team.name]} />

        <DetailPageNavigation
          previousItem={
            previousTeam
              ? {
                  label: previousTeam.name,
                  path: `/teams/${toEntitySlug(previousTeam.name)}`,
                }
              : null
          }
          nextItem={
            nextTeam
              ? {
                  label: nextTeam.name,
                  path: `/teams/${toEntitySlug(nextTeam.name)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
