import { Box, Container, useComputedColorScheme } from '@mantine/core';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChangeHistory from '../../components/common/ChangeHistory';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import DetailPageNavigation from '../../components/common/DetailPageNavigation';
import EntityNotFound from '../../components/common/EntityNotFound';
import { DetailPageLoading } from '../../components/layout/PageLoadingSkeleton';
import { STORAGE_KEY } from '../../constants/ui';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';
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
import { useTeamDetailData } from '../../hooks/use-team-detail-data';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
  toEntitySlug,
} from '../../utils/entity-slug';
import {
  exportTeamCompositionAsImage,
  hasTeamBuilderDraft,
} from '../../utils/team-page';
import { TeamHeroSection } from './HeroSection';
import TeamDetailContent from './TeamDetailContent';

export default function TeamPage() {
  const tooltipProps = useMobileTooltip();
  const { teamName } = useParams<{ teamName: string }>();
  const isDark = useComputedColorScheme('light') === 'dark';
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
  const navigate = useNavigate();
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const { data: teams, loading: loadingTeams } = useTeams();
  const { data: characters, loading: loadingChars } = useCharacters();
  const { data: wyrmspells, loading: loadingSpells } = useWyrmspells();
  const { data: factions, loading: loadingFactions } = useFactions();
  const { data: artifacts, loading: loadingArtifacts } = useArtifacts();
  const { data: statusEffects, loading: loadingStatusEffects } =
    useStatusEffects();
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

  const {
    preferredByName: charMap,
    byIdentity: characterByIdentity,
    nameCounts: characterNameCounts,
  } = useCharacterResolution(characters);

  const {
    getCharacterPath,
    factionInfo,
    artifactMap,
    factionColor,
    teamSynergy,
  } = useTeamDetailData({
    team,
    factions,
    artifacts,
    charMap,
    characterByIdentity,
    characterNameCounts,
    wyrmspells,
    fallbackFactionColor: accent.secondary,
  });

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

  const openEditInBuilder = () => {
    navigate('/teams', { state: { editTeam: team } });
  };

  const requestEdit = () => {
    if (!hasTeamBuilderDraft(STORAGE_KEY.TEAMS_BUILDER_DRAFT)) {
      setConfirmEditOpen(true);
      return;
    }
    openEditInBuilder();
  };

  const exportAsImage = async () => {
    setExporting(true);
    try {
      await exportTeamCompositionAsImage(exportRef, team.name, isDark);
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
        <TeamDetailContent
          team={team}
          teamSynergy={teamSynergy}
          charMap={charMap}
          characterByIdentity={characterByIdentity}
          getCharacterPath={getCharacterPath}
          factionColor={factionColor}
          accentPrimary={accent.primary}
          isDark={isDark}
          tooltipProps={tooltipProps}
          wyrmspells={wyrmspells}
          exportRef={exportRef}
          exporting={exporting}
          onExportAsImage={exportAsImage}
        />

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
