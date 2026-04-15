import { Box, Container } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import { STORAGE_KEY } from '@/constants/ui';
import {
  useArtifacts,
  useCharacterResolution,
  useCharacters,
  useDarkMode,
  useFactions,
  useGradientAccent,
  useMobileTooltip,
  useStatusEffects,
  useWyrmspells,
} from '@/hooks';
import { useTeamDetailData } from '@/features/teams/hooks/use-team-detail-data';
import type { Team } from '@/features/teams/types';
import { toEntitySlug } from '@/utils/entity-slug';
import {
  exportTeamCompositionAsImage,
  hasTeamBuilderDraft,
} from '@/features/teams/utils/team-page';
import { TeamHeroSection } from '@/features/teams/components/TeamHeroSection';
import TeamDetailContent from '@/features/teams/components/TeamDetailContent';

function readSavedTeamBySlug(slug: string): Team | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY.TEAMS_MY_SAVED);
    if (!raw) return null;
    const saves = JSON.parse(raw) as Record<string, unknown>;
    const val = saves[slug];
    if (
      val !== null &&
      typeof val === 'object' &&
      'members' in (val as object) &&
      Array.isArray((val as Team).members)
    ) {
      const team = val as Team;
      if ((team.last_updated ?? 0) > 0) return team;

      const normalized: Team = {
        ...team,
        last_updated: Math.floor(Date.now() / 1000),
      };
      saves[slug] = normalized;
      window.localStorage.setItem(
        STORAGE_KEY.TEAMS_MY_SAVED,
        JSON.stringify(saves)
      );
      return normalized;
    }
    return null;
  } catch {
    return null;
  }
}

function deleteSavedTeamFromStorage(name: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY.TEAMS_MY_SAVED);
    const saves = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    delete saves[toEntitySlug(name)];
    window.localStorage.setItem(
      STORAGE_KEY.TEAMS_MY_SAVED,
      JSON.stringify(saves)
    );
  } catch {
    // ignore
  }
}

export default function SavedTeamPage() {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const slug = teamSlug ?? '';
  const tooltipProps = useMobileTooltip();
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();
  const navigate = useNavigate();
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Read team from localStorage
  const [team, setTeam] = useState<Team | null>(() =>
    readSavedTeamBySlug(slug)
  );

  useEffect(() => {
    setTeam(readSavedTeamBySlug(slug));
  }, [slug]);

  const { data: characters, loading: loadingChars } = useCharacters();
  const { data: wyrmspells, loading: loadingSpells } = useWyrmspells();
  const { data: factions, loading: loadingFactions } = useFactions();
  const { data: artifacts, loading: loadingArtifacts } = useArtifacts();
  const { data: statusEffects, loading: loadingStatusEffects } =
    useStatusEffects();

  const loading =
    loadingChars ||
    loadingSpells ||
    loadingFactions ||
    loadingArtifacts ||
    loadingStatusEffects;

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
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DetailPageLoading />
      </Container>
    );
  }

  if (!team) {
    return (
      <EntityNotFound
        entityType="Saved Team"
        name={slug}
        backLabel="Back to Teams"
        backPath="/teams"
      />
    );
  }

  const openInBuilder = () => {
    navigate('/teams', { state: { editTeam: team } });
  };

  const requestLoadInBuilder = () => {
    if (!hasTeamBuilderDraft(STORAGE_KEY.TEAMS_BUILDER_DRAFT)) {
      openInBuilder();
      return;
    }
    setConfirmEditOpen(true);
  };

  const handleDelete = () => {
    deleteSavedTeamFromStorage(team.name);
    navigate('/teams?mode=saved', { replace: true });
  };

  const exportAsImage = async () => {
    if (!team) return;
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
        onRequestEdit={requestLoadInBuilder}
        onRequestDelete={() => setConfirmDeleteOpen(true)}
      />

      <ConfirmActionModal
        opened={confirmEditOpen}
        onCancel={() => setConfirmEditOpen(false)}
        title="Replace current builder data?"
        message="Loading this team will replace your current builder draft."
        confirmLabel="Replace"
        onConfirm={() => {
          setConfirmEditOpen(false);
          openInBuilder();
        }}
      />

      <ConfirmActionModal
        opened={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        title="Delete saved team?"
        message={`This will permanently delete "${team.name}" from your saved teams.`}
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          handleDelete();
        }}
      />

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <TeamDetailContent
          team={team}
          teamSynergy={teamSynergy}
          charMap={charMap}
          characterByIdentity={characterByIdentity}
          characterNameCounts={characterNameCounts}
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
      </Container>
    </Box>
  );
}
