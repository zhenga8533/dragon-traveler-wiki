import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { QUALITY_ORDER } from '@/constants/colors';
import HowlkinBadge from '@/features/wiki/howlkins/components/HowlkinBadge';
import type { GoldenAlliance, Howlkin } from '@/features/wiki/howlkins/types';
import { useDarkMode, useDataFetch, useGradientAccent } from '@/hooks';
import type { ChangesFile } from '@/types/changes';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
  toEntitySlug,
} from '@/utils/entity-slug';
import type { Quality } from '@/types/quality';
import {
  Badge,
  Box,
  Container,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function GoldenAllianceDetailPage() {
  const { accent } = useGradientAccent();
  const { allianceName } = useParams<{ allianceName: string }>();
  const navigate = useNavigate();
  const isDark = useDarkMode();

  const { data: alliances, loading } = useDataFetch<GoldenAlliance[]>(
    'data/golden_alliances.json',
    []
  );
  const { data: howlkins } = useDataFetch<Howlkin[]>('data/howlkins.json', []);
  const { data: changesData } = useDataFetch<ChangesFile>(
    'data/changes/golden_alliances.json',
    {}
  );

  const decodedName = useMemo(
    () =>
      findEntityByParam(alliances, allianceName, (a) => a.name)?.name ?? '',
    [alliances, allianceName]
  );

  useEffect(() => {
    if (!decodedName || !allianceName) return;
    if (!shouldRedirectToEntitySlug(allianceName, decodedName)) return;
    navigate(`/howlkins/${toEntitySlug(decodedName)}`, { replace: true });
  }, [decodedName, navigate, allianceName]);

  const alliance = useMemo(
    () =>
      alliances.find(
        (a) => a.name.toLowerCase() === decodedName.toLowerCase()
      ) ?? null,
    [alliances, decodedName]
  );

  const howlkinMap = useMemo(() => {
    const map = new Map<string, Howlkin>();
    for (const h of howlkins) map.set(h.name, h);
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

  const allAllianceNames = useMemo(
    () => alliances.map((a) => a.name).sort((a, b) => a.localeCompare(b)),
    [alliances]
  );

  const allianceIndex = useMemo(
    () =>
      allAllianceNames.findIndex(
        (n) => n.toLowerCase() === decodedName.toLowerCase()
      ),
    [allAllianceNames, decodedName]
  );

  const previousAlliance =
    allianceIndex > 0 ? allAllianceNames[allianceIndex - 1] : null;
  const nextAlliance =
    allianceIndex >= 0 && allianceIndex < allAllianceNames.length - 1
      ? allAllianceNames[allianceIndex + 1]
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
        name={allianceName}
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
          { label: decodedName },
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
              {decodedName}
            </Title>
            <Badge variant="light" color={accent.secondary} size="lg">
              {alliance.howlkins.length} member
              {alliance.howlkins.length !== 1 ? 's' : ''}
            </Badge>
          </Group>
          <LastUpdated timestamp={alliance.last_updated} />
        </Stack>
      </DetailPageHero>

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <Stack gap="xs">
            <Text fw={600} size="sm" c={isDark ? 'gray.1' : 'dark.7'}>
              Members
            </Text>
            <Group gap="xs" wrap="wrap">
              {sortedMembers.map((name) => (
                <HowlkinBadge
                  key={name}
                  name={name}
                  howlkin={howlkinMap.get(name)}
                />
              ))}
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm" c={isDark ? 'gray.1' : 'dark.7'}>
              Alliance Effects
            </Text>
            <Table withTableBorder withColumnBorders>
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
          </Stack>

          <ChangeHistory history={changesData[decodedName]} />

          <DetailPageNavigation
            previousItem={
              previousAlliance
                ? {
                    label: previousAlliance,
                    path: `/howlkins/${toEntitySlug(previousAlliance)}`,
                  }
                : null
            }
            nextItem={
              nextAlliance
                ? {
                    label: nextAlliance,
                    path: `/howlkins/${toEntitySlug(nextAlliance)}`,
                  }
                : null
            }
          />
        </Stack>
      </Container>
    </Box>
  );
}
