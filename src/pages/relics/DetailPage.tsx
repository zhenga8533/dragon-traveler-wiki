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
import RelicTypeTag from '@/features/wiki/relics/components/RelicTypeTag';
import type { Relic } from '@/features/wiki/relics/types';
import { useDarkMode, useDataFetch, useGradientAccent } from '@/hooks';
import type { ChangesFile } from '@/types/changes';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
  toEntitySlug,
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

export default function OracleScrollPage() {
  const { accent } = useGradientAccent();
  const { scrollName } = useParams<{ scrollName: string }>();
  const navigate = useNavigate();
  const isDark = useDarkMode();

  const { data: relics, loading } = useDataFetch<Relic[]>(
    'data/relic.json',
    []
  );
  const { data: changesData } = useDataFetch<ChangesFile>(
    'data/changes/relic.json',
    {}
  );

  // All distinct oracle scroll names, sorted
  const oracleScrollNames = useMemo(() => {
    const names = new Set<string>();
    for (const relic of relics) {
      if (relic.oracle_sroll) names.add(relic.oracle_sroll);
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
        (r) => r.oracle_sroll?.toLowerCase() === decodedScrollName.toLowerCase()
      )
      .sort((a, b) => {
        const typeCmp =
          RELIC_TYPE_ORDER.indexOf(a.type) - RELIC_TYPE_ORDER.indexOf(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
  }, [relics, decodedScrollName]);

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

  // All relics in a scroll share the same quality â€” use the first one for the hero color
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
    .filter((r) => changesData[r.name])
    .map((r) => ({ label: r.name, history: changesData[r.name] }));

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
        <Stack gap="lg">
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
          {illustrationSrc && (
            <SafeImage
              src={illustrationSrc}
              alt={decodedScrollName}
              radius="md"
              style={{
                border: `2px solid var(--mantine-color-${heroQualityColor}-${isDark ? 7 : 4})`,
                boxShadow: `0 4px 32px var(--mantine-color-${heroQualityColor}-${isDark ? 9 : 2})`,
              }}
            />
          )}
        </Stack>
      </DetailPageHero>

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {scrollRelics.map((relic) => {
              const iconSrc = getRelicIcon(relic.name);
              return (
                <Paper
                  key={relic.name}
                  p="md"
                  radius="md"
                  withBorder
                  {...getCardHoverProps()}
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
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Text
                          fw={700}
                          size="lg"
                          className="dt-link-text"
                          lineClamp={1}
                        >
                          {relic.name}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          <RelicTypeTag type={relic.type} />
                          <QualityIcon quality={relic.quality} />
                        </Group>
                      </Stack>
                    </Group>

                    <Paper
                      p="sm"
                      radius="sm"
                      withBorder
                      {...getCardHoverProps({
                        style: getLoreGlassStyles(isDark),
                      })}
                    >
                      <Text size="sm" c="dimmed" fs="italic">
                        {relic.lore}
                      </Text>
                    </Paper>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>

          <ChangeHistory history={undefined} extraHistories={relicHistories} />

          <DetailPageNavigation
            previousItem={
              previousScroll
                ? {
                    label: previousScroll,
                    path: `/oracle-scrolls/${toEntitySlug(previousScroll)}`,
                  }
                : null
            }
            nextItem={
              nextScroll
                ? {
                    label: nextScroll,
                    path: `/oracle-scrolls/${toEntitySlug(nextScroll)}`,
                  }
                : null
            }
          />
        </Stack>
      </Container>
    </Box>
  );
}
