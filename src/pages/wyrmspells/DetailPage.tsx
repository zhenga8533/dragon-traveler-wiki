import SafeImage from '@/components/ui/SafeImage';
import { getWyrmspellIcon } from '@/assets';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import RichText from '@/components/common/RichText';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import {
  QUALITY_ORDER,
  WYRMSPELL_TYPE_COLOR,
  getStableTagColor,
} from '@/constants/colors';
import { COMPACT_COL_STYLE, getHeroIconBoxStyles } from '@/constants/styles';
import type { Wyrmspell, WyrmspellQuality } from '@/features/wiki/wyrmspells/types';
import { getMaxQuality } from '@/features/wiki/wyrmspells/types';
import { useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
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
  Table,
  Stack,
  Title,
} from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function QualitiesTable({
  qualities,
  statusEffects,
}: {
  qualities: WyrmspellQuality[];
  statusEffects: StatusEffect[];
}) {
  if (qualities.length === 0) return null;
  return (
    <Table striped withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={COMPACT_COL_STYLE}>Quality</Table.Th>
          <Table.Th>Effect</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {qualities.map((q) => (
          <Table.Tr key={q.quality}>
            <Table.Td style={COMPACT_COL_STYLE}>
              <QualityIcon quality={q.quality} />
            </Table.Td>
            <Table.Td>
              <RichText text={q.effect} statusEffects={statusEffects} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export default function WyrmspellPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const isDark = useDarkMode();

  const { data: wyrmspells, loading } = useDataFetch<Wyrmspell[]>(
    'data/wyrmspells.json',
    []
  );
  const { data: statusEffects } = useStatusEffects();
  const { data: changesData } = useDataFetch<ChangesFile>(
    'data/changes/wyrmspells.json',
    {}
  );

  const wyrmspell = useMemo(
    () => findEntityByParam(wyrmspells, name, (w) => w.name),
    [wyrmspells, name]
  );

  useEffect(() => {
    if (!wyrmspell || !name) return;
    if (!shouldRedirectToEntitySlug(name, wyrmspell.name)) return;
    navigate(`/wyrmspells/${toEntitySlug(wyrmspell.name)}`, { replace: true });
  }, [wyrmspell, name, navigate]);

  const orderedWyrmspells = useMemo(
    () =>
      [...wyrmspells].sort((a, b) => {
        const typeCmp = a.type.localeCompare(b.type);
        if (typeCmp !== 0) return typeCmp;
        const mA = getMaxQuality(a)?.quality;
        const mB = getMaxQuality(b)?.quality;
        const qA = mA !== undefined ? QUALITY_ORDER.indexOf(mA) : -1;
        const qB = mB !== undefined ? QUALITY_ORDER.indexOf(mB) : -1;
        if (qA !== qB)
          return (qA === -1 ? 999 : qA) - (qB === -1 ? 999 : qB);
        return a.name.localeCompare(b.name);
      }),
    [wyrmspells]
  );

  const wyrmspellIndex = useMemo(() => {
    if (!wyrmspell) return -1;
    return orderedWyrmspells.findIndex(
      (w) => w.name.toLowerCase() === wyrmspell.name.toLowerCase()
    );
  }, [wyrmspell, orderedWyrmspells]);

  const previousWyrmspell =
    wyrmspellIndex > 0 ? orderedWyrmspells[wyrmspellIndex - 1] : null;
  const nextWyrmspell =
    wyrmspellIndex >= 0 && wyrmspellIndex < orderedWyrmspells.length - 1
      ? orderedWyrmspells[wyrmspellIndex + 1]
      : null;

  if (loading) {
    return (
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DetailPageLoading />
      </Container>
    );
  }

  if (!wyrmspell) {
    return (
      <EntityNotFound
        entityType="Wyrmspell"
        name={name}
        backLabel="Back to Wyrmspells"
        backPath="/wyrmspells"
      />
    );
  }

  const iconSrc = getWyrmspellIcon(wyrmspell.name, wyrmspell.type);
  const maxQuality = getMaxQuality(wyrmspell);
  const typeColor =
    WYRMSPELL_TYPE_COLOR[wyrmspell.type] ?? getStableTagColor(wyrmspell.type);

  return (
    <Box>
      <DetailPageHero
        isDark={isDark}
        qualityColor={typeColor}
        secondaryColor={accent.secondary}
        breadcrumbItems={[
          { label: 'Wyrmspells', path: '/wyrmspells' },
          { label: wyrmspell.name },
        ]}
      >
        <Group gap="lg" align="flex-start" wrap="nowrap">
          {iconSrc && (
            <Box style={getHeroIconBoxStyles(isDark, typeColor, true)}>
              <SafeImage
                src={iconSrc}
                alt={wyrmspell.name}
                w={72}
                h={72}
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
                {wyrmspell.name}
              </Title>
              {maxQuality && (
                <QualityIcon quality={maxQuality.quality} size={32} />
              )}
            </Group>
            <LastUpdated timestamp={wyrmspell.last_updated} />
            <Group gap="sm" mt={4}>
              <Badge size="lg" variant="light" color={typeColor}>
                {wyrmspell.type}
              </Badge>
              {wyrmspell.exclusive_faction && (
                <FactionTag faction={wyrmspell.exclusive_faction} size="md" />
              )}
            </Group>
          </Stack>
        </Group>
      </DetailPageHero>

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="xl">
          <Stack gap="md">
            <Title order={2} size="h3">
              Effects by Quality
            </Title>
            <QualitiesTable
              qualities={wyrmspell.qualities}
              statusEffects={statusEffects}
            />
          </Stack>
        </Stack>

        <ChangeHistory history={changesData[wyrmspell.name]} />

        <DetailPageNavigation
          previousItem={
            previousWyrmspell
              ? {
                  label: previousWyrmspell.name,
                  path: `/wyrmspells/${toEntitySlug(previousWyrmspell.name)}`,
                }
              : null
          }
          nextItem={
            nextWyrmspell
              ? {
                  label: nextWyrmspell.name,
                  path: `/wyrmspells/${toEntitySlug(nextWyrmspell.name)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
