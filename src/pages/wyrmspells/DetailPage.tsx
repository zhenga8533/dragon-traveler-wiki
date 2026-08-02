import SafeImage from '@/components/ui/SafeImage';
import { getWyrmspellIcon } from '@/assets';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import WyrmspellTypeTag from '@/features/wiki/wyrmspells/components/WyrmspellTypeTag';
import { getStableTagColor } from '@/constants/tag-colors';
import { WYRMSPELL_TYPE_COLOR } from '@/constants/wyrmspell-colors';
import { getHeroIconBoxStyles } from '@/constants/detail-styles';
import { IMAGE_SIZE } from '@/constants/ui';
import { getMaxQuality } from '@/features/wiki/wyrmspells/types';
import QualitiesTable from '@/features/wiki/wyrmspells/components/QualitiesTable';
import {
  useStatusEffects,
  useWyrmspellChanges,
  useWyrmspells,
} from '@/features/wiki/hooks/use-wiki-data';
import { useDarkMode, useGradientAccent } from '@/hooks';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
} from '@/utils/entity-slug';
import { compareQuality } from '@/utils/quality';
import { Box, Container, Group, Stack, Title } from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

export default function WyrmspellPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const isDark = useDarkMode();

  const { data: wyrmspells, loading } = useWyrmspells();
  const { data: statusEffects } = useStatusEffects();
  const { data: changesData } = useWyrmspellChanges();

  const wyrmspell = useMemo(
    () => findEntityByParam(wyrmspells, name, (w) => w.slug),
    [wyrmspells, name],
  );

  useEffect(() => {
    if (!wyrmspell || !name) return;
    if (!shouldRedirectToEntitySlug(name, wyrmspell.slug)) return;
    navigate(`/wyrmspells/${wyrmspell.slug}`, { replace: true });
  }, [wyrmspell, name, navigate]);

  const orderedWyrmspells = useMemo(
    () =>
      [...wyrmspells].sort((a, b) => {
        const typeCmp = a.type.localeCompare(b.type);
        if (typeCmp !== 0) return typeCmp;
        const qualityComparison = compareQuality(
          getMaxQuality(a)?.quality,
          getMaxQuality(b)?.quality,
        );
        if (qualityComparison !== 0) return qualityComparison;
        return a.name.localeCompare(b.name);
      }),
    [wyrmspells],
  );

  const wyrmspellIndex = useMemo(() => {
    if (!wyrmspell) return -1;
    return orderedWyrmspells.findIndex((w) => w.slug === wyrmspell.slug);
  }, [wyrmspell, orderedWyrmspells]);

  const previousWyrmspell =
    wyrmspellIndex > 0 ? orderedWyrmspells[wyrmspellIndex - 1] : null;
  const nextWyrmspell =
    wyrmspellIndex >= 0 && wyrmspellIndex < orderedWyrmspells.length - 1
      ? orderedWyrmspells[wyrmspellIndex + 1]
      : null;

  if (loading) {
    return <DetailPageLoading />;
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

  const iconSrc = getWyrmspellIcon(wyrmspell.slug, wyrmspell.type);
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
                {wyrmspell.name}
              </Title>
              {maxQuality && (
                <QualityIcon quality={maxQuality.quality} size={32} />
              )}
            </Group>
            <LastUpdated timestamp={wyrmspell.last_updated} />
            <Group gap="sm" mt={4}>
              <WyrmspellTypeTag type={wyrmspell.type} size="lg" />
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

        <ChangeHistory history={changesData[wyrmspell.slug]} />

        <DetailPageNavigation
          previousItem={
            previousWyrmspell
              ? {
                  label: previousWyrmspell.name,
                  path: `/wyrmspells/${previousWyrmspell.slug}`,
                  iconSrc: getWyrmspellIcon(
                    previousWyrmspell.slug,
                    previousWyrmspell.type,
                  ),
                }
              : null
          }
          nextItem={
            nextWyrmspell
              ? {
                  label: nextWyrmspell.name,
                  path: `/wyrmspells/${nextWyrmspell.slug}`,
                  iconSrc: getWyrmspellIcon(
                    nextWyrmspell.slug,
                    nextWyrmspell.type,
                  ),
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
