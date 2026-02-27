import {
  Badge,
  Box,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getArtifactIcon, getTreasureIcon } from '../assets/artifacts';
import ClassTag from '../components/common/ClassTag';
import DetailPageNavigation from '../components/common/DetailPageNavigation';
import EntityNotFound from '../components/common/EntityNotFound';
import FactionTag from '../components/common/FactionTag';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import QualityIcon from '../components/common/QualityIcon';
import RichText from '../components/common/RichText';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { DetailPageLoading } from '../components/layout/PageLoadingSkeleton';
import { QUALITY_COLOR, QUALITY_ORDER } from '../constants/colors';
import { getLoreGlassStyles } from '../constants/glass';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  FLEX_1_STYLE,
  FLEX_SHRINK_0_STYLE,
  RELATIVE_Z1_STYLE,
  getDetailHeroGradient,
  getHeroIconBoxStyles,
} from '../constants/styles';
import { useDataFetch } from '../hooks';
import type {
  Artifact,
  ArtifactEffect,
  ArtifactTreasure,
} from '../types/artifact';
import type { Faction } from '../types/faction';
import type { StatusEffect } from '../types/status-effect';

function EffectTable({
  effects,
  statusEffects,
}: {
  effects: ArtifactEffect[];
  statusEffects: StatusEffect[];
}) {
  if (effects.length === 0) return null;
  return (
    <Table striped withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={70}>Level</Table.Th>
          <Table.Th>Effect</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {effects.map((eff) => (
          <Table.Tr key={eff.level}>
            <Table.Td>
              <Text size="sm" fw={600}>
                {eff.level}
              </Text>
            </Table.Td>
            <Table.Td>
              <RichText text={eff.description} statusEffects={statusEffects} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function TreasureCard({
  treasure,
  artifactName,
  isDark,
  qualityColor,
  statusEffects,
}: {
  treasure: ArtifactTreasure;
  artifactName: string;
  isDark: boolean;
  qualityColor: string;
  statusEffects: StatusEffect[];
}) {
  const iconSrc = getTreasureIcon(artifactName, treasure.name);
  return (
    <Paper
      p="lg"
      radius="md"
      withBorder
      style={{
        borderTop: `3px solid var(--mantine-color-${qualityColor}-${isDark ? 7 : 5})`,
      }}
    >
      <Stack gap="md">
        <Group gap="md" wrap="nowrap" align="flex-start">
          {iconSrc && (
            <Image
              src={iconSrc}
              alt={treasure.name}
              w={64}
              h={64}
              fit="contain"
              radius="sm"
              style={FLEX_SHRINK_0_STYLE}
              loading="lazy"
            />
          )}
          <Stack gap={4} style={FLEX_1_STYLE}>
            <Text fw={700} size="lg">
              {treasure.name}
            </Text>
            <ClassTag characterClass={treasure.character_class} size="sm" />
          </Stack>
        </Group>
        <Text size="sm" c="dimmed" fs="italic" lh={1.6}>
          {treasure.lore}
        </Text>
        <EffectTable effects={treasure.effect} statusEffects={statusEffects} />
      </Stack>
    </Paper>
  );
}

export default function ArtifactPage() {
  const { name } = useParams<{ name: string }>();
  const isDark = useComputedColorScheme('light') === 'dark';

  const { data: artifacts, loading } = useDataFetch<Artifact[]>(
    'data/artifacts.json',
    []
  );
  const { data: statusEffects } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );
  const { data: factions } = useDataFetch<Faction[]>('data/factions.json', []);

  const artifact = useMemo(() => {
    if (!name) return null;
    const decodedName = decodeURIComponent(name);
    return artifacts.find(
      (a) => a.name.toLowerCase() === decodedName.toLowerCase()
    );
  }, [artifacts, name]);

  // Match list page: sort by quality, then name
  const orderedArtifacts = useMemo(
    () =>
      [...artifacts].sort((a, b) => {
        const qA = QUALITY_ORDER.indexOf(a.quality);
        const qB = QUALITY_ORDER.indexOf(b.quality);
        if (qA !== qB) return qA - qB;
        return a.name.localeCompare(b.name);
      }),
    [artifacts]
  );

  const artifactIndex = useMemo(() => {
    if (!artifact) return -1;
    return orderedArtifacts.findIndex(
      (entry) => entry.name.toLowerCase() === artifact.name.toLowerCase()
    );
  }, [artifact, orderedArtifacts]);

  const recommendingFactions = useMemo(() => {
    if (!artifact) return [];
    return factions.filter((f) =>
      f.recommended_artifacts.some(
        (a) => a.toLowerCase() === artifact.name.toLowerCase()
      )
    );
  }, [factions, artifact]);

  const previousArtifact =
    artifactIndex > 0 ? orderedArtifacts[artifactIndex - 1] : null;
  const nextArtifact =
    artifactIndex >= 0 && artifactIndex < orderedArtifacts.length - 1
      ? orderedArtifacts[artifactIndex + 1]
      : null;

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <DetailPageLoading />
      </Container>
    );
  }

  if (!artifact) {
    return (
      <EntityNotFound
        entityType="Artifact"
        name={name}
        backLabel="Back to Artifacts"
        backPath="/artifacts"
      />
    );
  }

  const iconSrc = getArtifactIcon(artifact.name);
  const qualityColor = QUALITY_COLOR[artifact.quality] ?? 'gray';

  return (
    <Box>
      {/* Hero Section */}
      <Box style={DETAIL_HERO_WRAPPER_STYLES}>
        <Box style={getDetailHeroGradient(isDark, qualityColor)} />

        <Container size="lg" style={RELATIVE_Z1_STYLE} py="xl">
          <Stack gap="lg">
            <Breadcrumbs
              items={[
                { label: 'Artifacts', path: '/artifacts' },
                { label: artifact.name },
              ]}
            />

            <Group gap="lg" align="flex-start" wrap="nowrap">
              {iconSrc && (
                <Box style={getHeroIconBoxStyles(isDark, qualityColor)}>
                  <Image
                    src={iconSrc}
                    alt={artifact.name}
                    w={72}
                    h={72}
                    fit="contain"
                    radius="sm"
                  />
                </Box>
              )}

              <Stack gap={6} style={FLEX_1_STYLE}>
                <Group gap="sm" align="center">
                  <QualityIcon quality={artifact.quality} size={28} />
                  <Title
                    order={1}
                    c={isDark ? 'white' : 'dark'}
                    style={{ lineHeight: 1.2 }}
                  >
                    {artifact.name}
                  </Title>
                </Group>
                <LastUpdated timestamp={artifact.last_updated} />
                <Group gap="sm" mt={4}>
                  <Badge size="lg" variant="light" color="blue">
                    {artifact.rows}x{artifact.columns}
                  </Badge>
                  <GlobalBadge isGlobal={artifact.is_global} size="md" />
                  <Badge size="lg" variant="outline" color="gray">
                    {artifact.treasures.length} treasure
                    {artifact.treasures.length !== 1 ? 's' : ''}
                  </Badge>
                </Group>
                {recommendingFactions.length > 0 && (
                  <Group gap="xs" mt={2}>
                    <Text size="sm" c="dimmed">
                      Recommended by:
                    </Text>
                    {recommendingFactions.map((f) => (
                      <FactionTag key={f.name} faction={f.name} size="sm" />
                    ))}
                  </Group>
                )}
              </Stack>
            </Group>

            <Paper p="md" radius="md" style={getLoreGlassStyles(isDark)}>
              <Text size="sm" lh={1.6} fs="italic">
                {artifact.lore}
              </Text>
            </Paper>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Artifact Effects */}
          <Stack gap="md">
            <Title order={3}>Artifact Effects</Title>
            <EffectTable
              effects={artifact.effect}
              statusEffects={statusEffects}
            />
          </Stack>

          {/* Treasures */}
          {artifact.treasures.length > 0 && (
            <Stack gap="md">
              <Group gap="sm">
                <Title order={3}>Treasures</Title>
                <Badge variant="light" color="violet" size="sm">
                  {artifact.treasures.length} treasure
                  {artifact.treasures.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {artifact.treasures.map((treasure) => (
                  <TreasureCard
                    key={treasure.name}
                    treasure={treasure}
                    artifactName={artifact.name}
                    isDark={isDark}
                    qualityColor={qualityColor}
                    statusEffects={statusEffects}
                  />
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </Stack>

        <DetailPageNavigation
          previousItem={
            previousArtifact
              ? {
                  label: previousArtifact.name,
                  path: `/artifacts/${encodeURIComponent(previousArtifact.name)}`,
                }
              : null
          }
          nextItem={
            nextArtifact
              ? {
                  label: nextArtifact.name,
                  path: `/artifacts/${encodeURIComponent(nextArtifact.name)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
