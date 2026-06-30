import SafeImage from '@/components/ui/SafeImage';
import { getArtifactIcon, getTreasureIcon } from '@/assets';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import RichText from '@/components/common/RichText';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import ClassTag from '@/components/ui/ClassTag';
import EntityNotFound from '@/components/ui/EntityNotFound';
import FactionTag from '@/components/ui/FactionTag';
import GlobalBadge from '@/components/ui/GlobalBadge';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_COLOR, QUALITY_ORDER } from '@/constants/quality';
import { getLoreGlassStyles } from '@/constants/glass';
import { getHeroIconBoxStyles } from '@/constants/detail-styles';
import { getCardHoverProps } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import EffectTable from '@/features/wiki/artifacts/components/EffectTable';
import type { ArtifactTreasure } from '@/features/wiki/artifacts/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useArtifactChanges, useArtifacts, useDarkMode, useFactions, useGradientAccent, useStatusEffects } from '@/hooks';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
} from '@/utils/entity-slug';
import {
  Badge,
  Box,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function TreasureCard({
  treasure,
  artifactSlug,
  isDark,
  qualityColor,
  statusEffects,
}: {
  treasure: ArtifactTreasure;
  artifactSlug: string;
  isDark: boolean;
  qualityColor: string;
  statusEffects: StatusEffect[];
}) {
  const iconSrc = getTreasureIcon(artifactSlug, treasure.name);
  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      {...getCardHoverProps({
        style: {
          borderTop: `3px solid var(--mantine-color-${qualityColor}-${isDark ? 7 : 5})`,
        },
      })}
    >
      <Stack gap="md">
        <Group gap="md" wrap="nowrap" align="flex-start">
          {iconSrc && (
            <SafeImage
              src={iconSrc}
              alt={treasure.name}
              w={IMAGE_SIZE.CARD_ICON}
              h={IMAGE_SIZE.CARD_ICON}
              fit="contain"
              radius="sm"
              style={{ flexShrink: 0 }}
              loading="lazy"
            />
          )}
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="lg">
              {treasure.name}
            </Text>
            <ClassTag characterClass={treasure.character_class} size="sm" />
          </Stack>
        </Group>
        <RichText text={treasure.lore} statusEffects={statusEffects} italic lineHeight={1.6} />
        <EffectTable effects={treasure.effect} statusEffects={statusEffects} />
      </Stack>
    </Paper>
  );
}

export default function ArtifactPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const isDark = useDarkMode();

  const { data: artifacts, loading } = useArtifacts();
  const { data: statusEffects } = useStatusEffects();
  const { data: factions } = useFactions();
  const { data: changesData } = useArtifactChanges();

  const artifact = useMemo(() => {
    return findEntityByParam(artifacts, name, (a) => a.slug);
  }, [artifacts, name]);

  useEffect(() => {
    if (!artifact || !name) return;
    if (!shouldRedirectToEntitySlug(name, artifact.slug)) return;
    navigate(`/artifacts/${artifact.slug}`, { replace: true });
  }, [artifact, name, navigate]);

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
    return orderedArtifacts.findIndex((entry) => entry.slug === artifact.slug);
  }, [artifact, orderedArtifacts]);

  const recommendingFactions = useMemo(() => {
    if (!artifact) return [];
    return factions.filter((f) =>
      f.recommended_artifacts.some((a) => a === artifact.slug)
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
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
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

  const iconSrc = getArtifactIcon(artifact.slug);
  const qualityColor = QUALITY_COLOR[artifact.quality];

  return (
    <Box>
      <DetailPageHero
        isDark={isDark}
        qualityColor={qualityColor}
        breadcrumbItems={[
          { label: 'Artifacts', path: '/artifacts' },
          { label: artifact.name },
        ]}
        py={{ base: 'lg', sm: 'xl' }}
      >
        <Group gap="lg" align="flex-start" wrap="nowrap">
          {iconSrc && (
            <Box style={getHeroIconBoxStyles(isDark, qualityColor)}>
              <SafeImage
                src={iconSrc}
                alt={artifact.name}
                w={IMAGE_SIZE.DETAIL_ICON}
                h={IMAGE_SIZE.DETAIL_ICON}
                fit="contain"
                radius="sm"
              />
            </Box>
          )}

          <Stack gap={6} style={{ flex: 1 }}>
            <Group gap="sm" align="center">
              <Title
                order={1}
                c={isDark ? 'white' : 'dark'}
                fz={{ base: '1.5rem', sm: '2.125rem' }}
                style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
              >
                {artifact.name}
              </Title>
              <QualityIcon quality={artifact.quality} size={32} />
            </Group>
            <LastUpdated timestamp={artifact.last_updated} />
            <Group gap="sm" mt={4}>
              <Badge size="lg" variant="light" color={accent.secondary}>
                {artifact.rows}x{artifact.columns}
              </Badge>
              <GlobalBadge isGlobal={artifact.is_global} size="md" />
              <Badge size="lg" variant="light" color={accent.tertiary}>
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
                  <FactionTag key={f.slug} faction={f.slug} size="sm" />
                ))}
              </Group>
            )}
          </Stack>
        </Group>

        <Paper
          p="md"
          radius="md"
          withBorder
          {...getCardHoverProps({
            style: getLoreGlassStyles(isDark),
          })}
        >
          <RichText text={artifact.lore} statusEffects={statusEffects} italic lineHeight={1.6} />
        </Paper>
      </DetailPageHero>

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="xl">
          {/* Artifact Effects */}
          <Stack gap="md">
            <Title order={2} size="h3">
              Artifact Effects
            </Title>
            <EffectTable
              effects={artifact.effect}
              statusEffects={statusEffects}
            />
          </Stack>

          {/* Treasures */}
          {artifact.treasures.length > 0 && (
            <Stack gap="md">
              <Group gap="sm">
                <Title order={2} size="h3">
                  Treasures
                </Title>
                <Badge variant="light" color={accent.tertiary} size="sm">
                  {artifact.treasures.length} treasure
                  {artifact.treasures.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {artifact.treasures.map((treasure) => (
                  <TreasureCard
                    key={treasure.name}
                    treasure={treasure}
                    artifactSlug={artifact.slug}
                    isDark={isDark}
                    qualityColor={qualityColor}
                    statusEffects={statusEffects}
                  />
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </Stack>

        <ChangeHistory history={changesData[artifact.slug]} />

        <DetailPageNavigation
          previousItem={
            previousArtifact
              ? {
                  label: previousArtifact.name,
                  path: `/artifacts/${previousArtifact.slug}`,
                  iconSrc: getArtifactIcon(previousArtifact.slug),
                }
              : null
          }
          nextItem={
            nextArtifact
              ? {
                  label: nextArtifact.name,
                  path: `/artifacts/${nextArtifact.slug}`,
                  iconSrc: getArtifactIcon(nextArtifact.slug),
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
