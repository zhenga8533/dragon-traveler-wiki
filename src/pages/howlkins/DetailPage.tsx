import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import QualityIcon from '@/components/ui/QualityIcon';
import SafeImage from '@/components/ui/SafeImage';
import { QUALITY_COLOR, QUALITY_ORDER } from '@/constants/quality';
import { getCardHoverProps } from '@/constants/styles';
import HowlkinStats from '@/features/wiki/howlkins/components/HowlkinStats';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import { getHowlkinIcon } from '@/assets';
import { useGoldenAllianceChanges, useGoldenAlliances, useHowlkins } from '@/features/wiki/hooks/use-wiki-data';
import { useDarkMode, useGradientAccent } from '@/hooks';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
} from '@/utils/entity-slug';
import type { Quality } from '@/types/quality';
import {
  Badge,
  Box,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function GoldenAllianceDetailPage() {
  const { accent } = useGradientAccent();
  const { allianceSlug: allianceParam } = useParams<{ allianceSlug: string }>();
  const navigate = useNavigate();
  const isDark = useDarkMode();

  const { data: alliances, loading } = useGoldenAlliances();
  const { data: howlkins } = useHowlkins();
  const { data: changesData } = useGoldenAllianceChanges();

  const alliance = useMemo(
    () => findEntityByParam(alliances, allianceParam, (a) => a.slug) ?? null,
    [alliances, allianceParam]
  );

  useEffect(() => {
    if (!alliance || !allianceParam) return;
    if (!shouldRedirectToEntitySlug(allianceParam, alliance.slug)) return;
    navigate(`/howlkins/${alliance.slug}`, { replace: true });
  }, [alliance, allianceParam, navigate]);

  const howlkinMap = useMemo(() => {
    const map = new Map<string, Howlkin>();
    for (const h of howlkins) map.set(h.slug, h);
    return map;
  }, [howlkins]);

  const sortedMembers = useMemo(() => {
    if (!alliance) return [];
    return [...alliance.howlkins].sort((a, b) => {
      const qA = QUALITY_ORDER.indexOf(
        howlkinMap.get(a)?.quality ?? ('' as Quality)
      );
      const qB = QUALITY_ORDER.indexOf(
        howlkinMap.get(b)?.quality ?? ('' as Quality)
      );
      if (qA !== qB) return qA - qB;
      return a.localeCompare(b);
    });
  }, [alliance, howlkinMap]);

  const orderedAlliances = useMemo(
    () => [...alliances].sort((a, b) => a.slug.localeCompare(b.slug)),
    [alliances]
  );

  const allianceIndex = useMemo(
    () => alliance ? orderedAlliances.findIndex((a) => a.slug === alliance.slug) : -1,
    [orderedAlliances, alliance]
  );

  const previousAlliance =
    allianceIndex > 0 ? orderedAlliances[allianceIndex - 1] : null;
  const nextAlliance =
    allianceIndex >= 0 && allianceIndex < orderedAlliances.length - 1
      ? orderedAlliances[allianceIndex + 1]
      : null;

  if (loading) {
    return (
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DetailPageLoading />
      </Container>
    );
  }

  if (!alliance) {
    return (
      <EntityNotFound
        entityType="Golden Alliance"
        name={allianceParam}
        backLabel="Back to Howlkins"
        backPath="/howlkins?tab=golden-alliances"
      />
    );
  }

  return (
    <Box>
      <DetailPageHero
        isDark={isDark}
        qualityColor={accent.primary}
        breadcrumbItems={[
          { label: 'Howlkins', path: '/howlkins' },
          {
            label: 'Golden Alliances',
            path: '/howlkins?tab=golden-alliances',
          },
          { label: alliance.name },
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
              {alliance.name}
            </Title>
            <Badge variant="light" color={accent.secondary} size="lg">
              {alliance.howlkins.length} member
              {alliance.howlkins.length !== 1 ? 's' : ''}
            </Badge>
          </Group>
          {alliance.last_updated !== undefined && (
            <LastUpdated timestamp={alliance.last_updated} />
          )}
        </Stack>
      </DetailPageHero>

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <Stack gap="md">
            <Title order={2} size="h3">
              Members
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
              {sortedMembers.map((howlkinSlug) => {
                const howlkin = howlkinMap.get(howlkinSlug);
                if (!howlkin) return null;
                const iconSrc = getHowlkinIcon(howlkin.slug, howlkin.quality);
                const qualityColor = QUALITY_COLOR[howlkin.quality];
                return (
                  <Paper
                    key={howlkinSlug}
                    p="sm"
                    radius="md"
                    withBorder
                    {...getCardHoverProps({
                      style: {
                        borderTop: `3px solid var(--mantine-color-${qualityColor}-${isDark ? 7 : 5})`,
                      },
                    })}
                  >
                    <Stack gap="xs">
                      <Group gap="sm" wrap="nowrap">
                        {iconSrc && (
                          <SafeImage
                            src={iconSrc}
                            alt={howlkin.name}
                            w={44}
                            h={44}
                            fit="contain"
                            radius="sm"
                          />
                        )}
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="xs" wrap="wrap">
                            <Text fw={600} size="sm">
                              {howlkin.name}
                            </Text>
                            <QualityIcon quality={howlkin.quality} size={14} />
                          </Group>
                          {(howlkin.passive_effects ?? []).map((e, i) => (
                            <Text key={i} size="xs" c="dimmed">
                              {e}
                            </Text>
                          ))}
                        </Stack>
                      </Group>
                      <HowlkinStats stats={howlkin.basic_stats} size="xs" />
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Stack>

          <Stack gap="md">
            <Title order={2} size="h3">
              Alliance Effects
            </Title>
            <Box style={{ overflowX: 'auto' }}>
              <Table striped withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 70 }}>Level</Table.Th>
                    <Table.Th>Stats</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {alliance.effects.map((effect) => (
                    <Table.Tr key={effect.level}>
                      <Table.Td>
                        <Badge
                          variant="light"
                          size="sm"
                          color={accent.secondary}
                        >
                          {effect.level}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="wrap">
                          {effect.stats.map((stat, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              size="sm"
                              color={accent.secondary}
                            >
                              {stat}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Stack>

        </Stack>

        <ChangeHistory history={changesData[alliance.slug]} />

        <DetailPageNavigation
          previousItem={
            previousAlliance
              ? {
                  label: previousAlliance.name,
                  path: `/howlkins/${previousAlliance.slug}`,
                }
              : null
          }
          nextItem={
            nextAlliance
              ? {
                  label: nextAlliance.name,
                  path: `/howlkins/${nextAlliance.slug}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
