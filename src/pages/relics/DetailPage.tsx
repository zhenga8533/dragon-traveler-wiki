import SafeImage from '@/components/ui/SafeImage';
import { getOracleScrollImage, getRelicIcon } from '@/assets';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_COLOR, RELIC_TYPE_ORDER } from '@/constants/colors';
import { getLoreGlassStyles } from '@/constants/glass';
import { getCardHoverProps } from '@/constants/styles';
import {
  getRelicOracleScroll,
  getRelicTypeOrder,
} from '@/features/wiki/relics/utils';
import RichText from '@/components/common/RichText';
import { useRelicChanges, useRelics, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import { useDarkMode, useGradientAccent, useMobileTooltip } from '@/hooks';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
  toEntitySlug,
} from '@/utils/entity-slug';
import IllustrationPreviewCard from '@/components/common/IllustrationPreviewCard';
import IllustrationPreviewModal from '@/components/common/IllustrationPreviewModal';
import type { CharacterIllustration } from '@/assets';
import {
  Badge,
  Box,
  Container,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function OracleScrollPage() {
  const { accent } = useGradientAccent();
  const { scrollName } = useParams<{ scrollName: string }>();
  const navigate = useNavigate();
  const isDark = useDarkMode();
  const tooltipProps = useMobileTooltip();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [illustrationExists, setIllustrationExists] = useState(false);

  const { data: relics, loading } = useRelics();
  const { data: changesData } = useRelicChanges();
  const { data: statusEffects } = useStatusEffects();

  // All distinct oracle scroll names, sorted
  const oracleScrollNames = useMemo(() => {
    const names = new Set<string>();
    for (const relic of relics) {
      const oracleScroll = getRelicOracleScroll(relic);
      if (oracleScroll) names.add(oracleScroll);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [relics]);

  const decodedScrollName = useMemo(
    () =>
      findEntityByParam(oracleScrollNames, scrollName, (name) => name) ?? '',
    [oracleScrollNames, scrollName]
  );

  useEffect(() => {
    if (!decodedScrollName || !scrollName) return;
    if (!shouldRedirectToEntitySlug(scrollName, decodedScrollName)) return;
    navigate(`/oracle-scrolls/${toEntitySlug(decodedScrollName)}`, {
      replace: true,
    });
  }, [decodedScrollName, navigate, scrollName]);

  const scrollRelics = useMemo(() => {
    if (!decodedScrollName) return [];
    return relics
      .filter(
        (r) =>
          getRelicOracleScroll(r)?.toLowerCase() ===
          decodedScrollName.toLowerCase()
      )
      .sort((a, b) => {
        const typeCmp =
          getRelicTypeOrder(a.type, RELIC_TYPE_ORDER) -
          getRelicTypeOrder(b.type, RELIC_TYPE_ORDER);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
  }, [relics, decodedScrollName]);

  const scrollRelicsByType = useMemo(() => {
    return RELIC_TYPE_ORDER.map((type) => ({
      type,
      relics: scrollRelics.filter((relic) => relic.type === type),
    })).filter((group) => group.relics.length > 0);
  }, [scrollRelics]);

  const scrollIndex = useMemo(
    () =>
      oracleScrollNames.findIndex(
        (n) => n.toLowerCase() === decodedScrollName.toLowerCase()
      ),
    [oracleScrollNames, decodedScrollName]
  );

  const previousScroll =
    scrollIndex > 0 ? oracleScrollNames[scrollIndex - 1] : null;
  const nextScroll =
    scrollIndex >= 0 && scrollIndex < oracleScrollNames.length - 1
      ? oracleScrollNames[scrollIndex + 1]
      : null;

  const lastUpdated = useMemo(
    () =>
      scrollRelics.reduce(
        (latest, r) => Math.max(latest, r.last_updated ?? 0),
        0
      ),
    [scrollRelics]
  );

  // All relics in a scroll share the same quality — use the first one for the hero color
  const heroQualityColor = useMemo(() => {
    if (!scrollRelics.length) return accent.primary;
    return QUALITY_COLOR[scrollRelics[0].quality] ?? accent.primary;
  }, [scrollRelics, accent.primary]);

  if (loading) {
    return (
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DetailPageLoading />
      </Container>
    );
  }

  if (!decodedScrollName || scrollRelics.length === 0) {
    return (
      <EntityNotFound
        entityType="Oracle Scroll"
        name={scrollName}
        backLabel="Back to Relics"
        backPath="/relics?tab=oracle-scrolls"
      />
    );
  }

  const illustrationSrc = getOracleScrollImage(decodedScrollName);

  // Collect per-relic change histories to display alongside the scroll
  const relicHistories = scrollRelics
    .filter((r) => changesData[r.slug])
    .map((r) => ({ label: r.name, history: changesData[r.slug] }));

  return (
    <Box>
      <DetailPageHero
        isDark={isDark}
        qualityColor={heroQualityColor}
        breadcrumbItems={[
          { label: 'Relics', path: '/relics' },
          { label: 'Oracle Scrolls', path: '/relics?tab=oracle-scrolls' },
          { label: decodedScrollName },
        ]}
        py={{ base: 'lg', sm: 'xl' }}
      >
        <Stack gap={6}>
          <Group gap="sm" align="center" wrap="wrap">
            <Title
              order={1}
              c={isDark ? 'white' : 'dark'}
              fz={{ base: '1.5rem', sm: '2.125rem' }}
              style={{ wordBreak: 'break-word' }}
            >
              {decodedScrollName}
            </Title>
            <QualityIcon quality={scrollRelics[0].quality} size={32} />
            <Badge variant="light" color={accent.secondary} size="lg">
              {scrollRelics.length} relic
              {scrollRelics.length !== 1 ? 's' : ''}
            </Badge>
          </Group>
          <LastUpdated timestamp={lastUpdated} />
        </Stack>
      </DetailPageHero>

      {illustrationSrc && (
        <img
          key={illustrationSrc}
          src={illustrationSrc}
          style={{ display: 'none' }}
          aria-hidden="true"
          onLoad={() => setIllustrationExists(true)}
          onError={() => setIllustrationExists(false)}
        />
      )}

      {illustrationExists && (
        <IllustrationPreviewModal
          opened={previewOpen}
          onClose={() => setPreviewOpen(false)}
          characterName={decodedScrollName}
          illustrations={[{ name: decodedScrollName, src: illustrationSrc!, type: 'image' } satisfies CharacterIllustration]}
          activeIllustration={{ name: decodedScrollName, src: illustrationSrc!, type: 'image' }}
          activeIllustrationIndex={0}
          hasMultipleIllustrations={false}
          showPreviousIllustration={() => {}}
          showNextIllustration={() => {}}
          onSelectIllustration={() => {}}
          tooltipProps={tooltipProps}
        />
      )}

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          {scrollRelicsByType.map((group) => {
            const isSanctuary = group.type === 'Sanctuary Relic';

            const relicCards = group.relics.map((relic) => {
              const iconSrc = getRelicIcon(relic.slug, relic.quality);
              return (
                <Paper
                  key={relic.name}
                  p="md"
                  radius="md"
                  withBorder
                  {...getCardHoverProps({
                    style: {
                      borderTop: `3px solid var(--mantine-color-${QUALITY_COLOR[relic.quality]}-${isDark ? 7 : 5})`,
                    },
                  })}
                >
                  <Stack gap="sm">
                    <Group gap="md" wrap="nowrap" align="flex-start">
                      {iconSrc && (
                        <SafeImage
                          src={iconSrc}
                          alt={relic.name}
                          w={64}
                          h={64}
                          fit="contain"
                          radius="sm"
                          loading="lazy"
                        />
                      )}
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs" align="center" wrap="wrap">
                          <Text fw={700} size="lg" className="dt-link-text" lineClamp={1}>
                            {relic.name}
                          </Text>
                          <QualityIcon quality={relic.quality} />
                        </Group>
                      </Stack>
                    </Group>

                    <Paper
                      p="sm"
                      radius="sm"
                      withBorder
                      {...getCardHoverProps({ style: getLoreGlassStyles(isDark) })}
                    >
                      <RichText text={relic.lore} statusEffects={statusEffects} italic />
                    </Paper>
                  </Stack>
                </Paper>
              );
            });

            return (
              <Stack key={group.type} gap="md">
                {isSanctuary && illustrationExists ? (
                  <Grid gutter="md" align="flex-start">
                    <Grid.Col span={{ base: 12, md: 7 }} order={{ base: 2, md: 1 }}>
                      <Stack gap="md">
                        <Title order={2} size="h3">{group.type}</Title>
                        {relicCards}
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 5 }} order={{ base: 1, md: 2 }}>
                      <IllustrationPreviewCard
                        src={illustrationSrc!}
                        name={decodedScrollName}
                        accentColor={accent.primary}
                        onExpand={() => setPreviewOpen(true)}
                      />
                    </Grid.Col>
                  </Grid>
                ) : (
                  <>
                    <Title order={2} size="h3">{group.type}</Title>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                      {relicCards}
                    </SimpleGrid>
                  </>
                )}
              </Stack>
            );
          })}

        </Stack>

        <ChangeHistory history={undefined} extraHistories={relicHistories} />

        <DetailPageNavigation
          previousItem={
            previousScroll
              ? {
                  label: previousScroll,
                  path: `/oracle-scrolls/${toEntitySlug(previousScroll)}`,
                  iconSrc: getOracleScrollImage(previousScroll),
                }
              : null
          }
          nextItem={
            nextScroll
              ? {
                  label: nextScroll,
                  path: `/oracle-scrolls/${toEntitySlug(nextScroll)}`,
                  iconSrc: getOracleScrollImage(nextScroll),
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
