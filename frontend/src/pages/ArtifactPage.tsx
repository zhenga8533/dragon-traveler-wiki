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
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { useMemo } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { Link, useParams } from 'react-router-dom';
import { getArtifactIcon, getTreasureIcon } from '../assets/artifacts';
import ClassTag from '../components/common/ClassTag';
import { QUALITY_ICON_MAP } from '../assets/quality';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import EntityNotFound from '../components/common/EntityNotFound';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import { DetailPageLoading } from '../components/layout/PageLoadingSkeleton';
import RichText from '../components/common/RichText';
import { QUALITY_COLOR } from '../constants/colors';
import { getLoreGlassStyles } from '../constants/glass';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  getDetailHeroGradient,
  getHeroIconBoxStyles,
} from '../constants/styles';
import { useDataFetch } from '../hooks/use-data-fetch';
import type {
  Artifact,
  ArtifactEffect,
  ArtifactTreasure,
} from '../types/artifact';
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
              style={{ flexShrink: 0 }}
              loading="lazy"
            />
          )}
          <Stack gap={4} style={{ flex: 1 }}>
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

  const artifact = useMemo(() => {
    if (!name) return null;
    const decodedName = decodeURIComponent(name);
    return artifacts.find(
      (a) => a.name.toLowerCase() === decodedName.toLowerCase()
    );
  }, [artifacts, name]);

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

        <Container
          size="lg"
          style={{ position: 'relative', zIndex: 1 }}
          py="xl"
        >
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

              <Stack gap={6} style={{ flex: 1 }}>
                <Group gap="sm" align="center">
                  <Tooltip label={artifact.quality}>
                    <Image
                      src={QUALITY_ICON_MAP[artifact.quality]}
                      alt={artifact.quality}
                      h={28}
                      w="auto"
                      fit="contain"
                    />
                  </Tooltip>
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
              </Stack>
            </Group>

            <Paper
              p="md"
              radius="md"
              style={getLoreGlassStyles(isDark)}
            >
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

        <Box mt="xl">
          <Link to="/artifacts" style={{ textDecoration: 'none' }}>
            <Group gap="xs" c="violet" style={{ cursor: 'pointer' }}>
              <IoArrowBack />
              <Text>Back to Artifacts</Text>
            </Group>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
