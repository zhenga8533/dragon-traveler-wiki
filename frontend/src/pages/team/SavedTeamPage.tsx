import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  CopyButton,
  Group,
  SimpleGrid,
  Stack,
  Title,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { downloadElementAsPng } from '../../utils/export-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IoCreate, IoDownload, IoTrash } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
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
  useWyrmspells,
} from '../../hooks/use-common-data';
import type { Artifact } from '../../types/artifact';
import type { Character } from '../../types/character';
import type { Team } from '../../types/team';
import {
  getCharacterRoutePath,
  getCharacterRoutePathByName,
  resolveCharacterByNameAndQuality,
} from '../../utils/character-route';
import { toEntitySlug } from '../../utils/entity-slug';
import { computeTeamSynergy } from '../../utils/team-synergy';
import { BattlefieldGrid } from './BattlefieldGrid';
import { BenchSection } from './BenchSection';
import { TeamHeroSection } from './HeroSection';

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
      return val as Team;
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
    window.localStorage.setItem(STORAGE_KEY.TEAMS_MY_SAVED, JSON.stringify(saves));
  } catch {
    // ignore
  }
}

export default function SavedTeamPage() {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const slug = teamSlug ?? '';
  const tooltipProps = useMobileTooltip();
  const isDark = useComputedColorScheme('light') === 'dark';
  const navigate = useNavigate();
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Read team from localStorage
  const [team, setTeam] = useState<Team | null>(() => readSavedTeamBySlug(slug));

  useEffect(() => {
    setTeam(readSavedTeamBySlug(slug));
  }, [slug]);

  const { data: characters, loading: loadingChars } = useCharacters();
  const { data: wyrmspells, loading: loadingSpells } = useWyrmspells();
  const { data: factions, loading: loadingFactions } = useFactions();
  const { data: artifacts, loading: loadingArtifacts } = useArtifacts();
  const { data: statusEffects, loading: loadingStatusEffects } = useStatusEffects();

  const loading =
    loadingChars ||
    loadingSpells ||
    loadingFactions ||
    loadingArtifacts ||
    loadingStatusEffects;

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
      overdriveCount: team.members.filter((m) => m.overdrive_order != null).length,
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
        entityType="Saved Team"
        name={slug}
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
    return Boolean(window.localStorage.getItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT));
  };

  const openInBuilder = () => {
    navigate('/teams', { state: { editTeam: team } });
  };

  const requestLoadInBuilder = () => {
    if (!hasBuilderDraft()) {
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
    if (!exportRef.current || !team) return;
    setExporting(true);
    try {
      await downloadElementAsPng(exportRef.current, team.name, isDark);
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

      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Secondary actions */}
          <Group gap="xs">
            <Button
              variant="light"
              size="sm"
              leftSection={<IoCreate size={16} />}
              onClick={requestLoadInBuilder}
            >
              Load into Builder
            </Button>
            <CopyButton value={JSON.stringify(team, null, 2)}>
              {({ copy, copied }) => (
                <Button
                  variant="light"
                  size="sm"
                  color={copied ? 'teal' : undefined}
                  onClick={copy}
                >
                  {copied ? 'Copied!' : 'Copy JSON'}
                </Button>
              )}
            </CopyButton>
            <Button
              variant="light"
              size="sm"
              color="red"
              leftSection={<IoTrash size={16} />}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Delete
            </Button>
          </Group>

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
      </Container>
    </Box>
  );
}
