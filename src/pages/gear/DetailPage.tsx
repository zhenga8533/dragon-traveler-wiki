import ExpandableText from '@/components/ui/ExpandableText';
import SafeImage from '@/components/ui/SafeImage';
import { getGearIcon } from '@/assets';
import ChangeHistory from '@/components/common/ChangeHistory';
import RichText from '@/components/common/RichText';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import QualityIcon from '@/components/ui/QualityIcon';
import {
  GEAR_TYPE_ORDER,
  QUALITY_COLOR,
  QUALITY_ORDER,
} from '@/constants/colors';
import { getLoreGlassStyles } from '@/constants/glass';
import { CURSOR_POINTER_STYLE, getCardHoverProps } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import {
  getCharacterRouteSlug,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useGear, useGearChanges, useGearSetChanges, useGearSets, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import {
  useDarkMode,
  useGradientAccent,
  useMobileTooltip,
} from '@/hooks';
import type { Quality } from '@/types/quality';
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
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const SSR_AND_ABOVE: Quality[] = ['UR', 'SSR EX', 'SSR+', 'SSR'];

export default function GearSetPage() {
  const { accent } = useGradientAccent();
  const { setName } = useParams<{ setName: string }>();
  const navigate = useNavigate();
  const isDark = useDarkMode();
  const tooltipProps = useMobileTooltip();
  const { data: gear, loading } = useGear();
  const { data: gearSets } = useGearSets();
  const { data: characters } = useCharacters();
  const { data: changesData } = useGearSetChanges();
  const { data: gearChangesData } = useGearChanges();
  const { data: statusEffects } = useStatusEffects();

  const setData = useMemo(
    () => findEntityByParam(gearSets, setName, (entry) => entry.slug) ?? null,
    [gearSets, setName]
  );

  const decodedSetSlug = setData?.slug ?? setName ?? '';

  useEffect(() => {
    if (!decodedSetSlug || !setName) return;
    if (!shouldRedirectToEntitySlug(setName, decodedSetSlug)) return;
    navigate(`/gear-sets/${decodedSetSlug}`, { replace: true });
  }, [decodedSetSlug, navigate, setName]);

  const setItems = useMemo(() => {
    if (!decodedSetSlug) return [];
    return gear
      .filter((item) => item.set === decodedSetSlug)
      .sort((a, b) => {
        const typeCmp =
          GEAR_TYPE_ORDER.indexOf(a.type) - GEAR_TYPE_ORDER.indexOf(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
  }, [decodedSetSlug, gear]);

  const gearItemHistories = useMemo(() => {
    return setItems
      .filter((item) => gearChangesData[item.slug])
      .map((item) => ({
        label: item.name,
        history: gearChangesData[item.slug],
      }));
  }, [setItems, gearChangesData]);

  const setItemNames = useMemo(
    () => new Set(setItems.map((i) => i.name)),
    [setItems]
  );

  const recommendedCharacters = useMemo(() => {
    const ssrChars = characters.filter((c) =>
      SSR_AND_ABOVE.includes(c.quality)
    );

    return ssrChars
      .filter(
        (c) =>
          c.recommended_gear &&
          Object.values(c.recommended_gear).some(
            (itemName) => itemName && setItemNames.has(itemName)
          )
      )
      .sort((a, b) => {
        const qualityDiff =
          QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
        if (qualityDiff !== 0) return qualityDiff;
        return a.name.localeCompare(b.name);
      });
  }, [characters, setItemNames]);

  const recommendedStats = useMemo(() => {
    const ssrChars = characters.filter((c) =>
      SSR_AND_ABOVE.includes(c.quality)
    );
    if (!ssrChars.length) return null;
    return {
      count: recommendedCharacters.length,
      total: ssrChars.length,
      percentage: Math.round(
        (recommendedCharacters.length / ssrChars.length) * 100
      ),
    };
  }, [characters, recommendedCharacters]);

  const [showAllCharacters, setShowAllCharacters] = useState(false);

  // Match list page: sort by slug
  const orderedSets = useMemo(
    () =>
      Array.from(new Map(gearSets.map((entry) => [entry.slug, entry])).values()).sort(
        (a, b) => a.slug.localeCompare(b.slug)
      ),
    [gearSets]
  );

  const setIndex = useMemo(() => {
    if (!decodedSetSlug) return -1;
    return orderedSets.findIndex((s) => s.slug === decodedSetSlug);
  }, [decodedSetSlug, orderedSets]);

  const previousSet = setIndex > 0 ? orderedSets[setIndex - 1] : null;
  const nextSet =
    setIndex >= 0 && setIndex < orderedSets.length - 1
      ? orderedSets[setIndex + 1]
      : null;

  if (loading) {
    return (
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DetailPageLoading />
      </Container>
    );
  }

  if (!decodedSetSlug || setItems.length === 0) {
    return (
      <EntityNotFound
        entityType="Gear Set"
        name={setName}
        backLabel="Back to Gear"
        backPath="/gear"
      />
    );
  }

  const setBonus = setData?.set_bonus ?? setItems[0]?.set_bonus;
  const qualityColor = QUALITY_COLOR[setItems[0].quality];
  const latestItemTimestamp = setItems.reduce(
    (latest, item) => Math.max(latest, item.last_updated ?? 0),
    0
  );
  const lastUpdatedTimestamp = setData?.last_updated ?? latestItemTimestamp;
  const displayedCharacters = showAllCharacters
    ? recommendedCharacters
    : recommendedCharacters.slice(0, 4);
  const remainingRecommendedCount = Math.max(
    recommendedCharacters.length - 4,
    0
  );

  return (
    <Box>
      <DetailPageHero
        isDark={isDark}
        qualityColor={qualityColor}
        breadcrumbItems={[
          { label: 'Gear', path: '/gear' },
          { label: setData?.name ?? decodedSetSlug },
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
              {setData?.name ?? decodedSetSlug} Set
            </Title>
            <QualityIcon quality={setItems[0].quality} size={32} />
            <Badge variant="light" color={accent.secondary} size="lg">
              {setItems.length} item{setItems.length !== 1 ? 's' : ''}
            </Badge>
          </Group>
          <LastUpdated timestamp={lastUpdatedTimestamp} />
          {setBonus && setBonus.quantity > 0 && (
            <Text c="dimmed" size="sm">
              {setBonus.quantity}-piece set bonus:{' '}
              <RichText text={setBonus.description} statusEffects={statusEffects} />
            </Text>
          )}
          {recommendedStats !== null && (
            <Text size="sm" c="dimmed">
              Recommended for{' '}
              <Text span fw={600} className="dt-link-text">
                {recommendedStats.count}
              </Text>{' '}
              of {recommendedStats.total} SSR and above characters (
              {recommendedStats.percentage}%)
            </Text>
          )}
        </Stack>

        {setBonus && setBonus.quantity > 0 && (
          <Paper
            p="md"
            radius="md"
            withBorder
            {...getCardHoverProps({
              style: getLoreGlassStyles(isDark),
            })}
          >
            <Stack gap={4}>
              <Text fw={600} size="sm">
                Set Bonus
              </Text>
              <Text size="sm" c="dimmed">
                Activate {setBonus.quantity} piece
                {setBonus.quantity !== 1 ? 's' : ''} to gain{' '}
                <RichText text={setBonus.description} statusEffects={statusEffects} />
              </Text>
            </Stack>
          </Paper>
        )}

        {recommendedCharacters.length > 0 && (
          <Stack gap={8}>
            <Text size="sm" fw={600} c={isDark ? 'gray.1' : 'dark.7'}>
              Recommended Characters
            </Text>
            <Group gap="xs" wrap="wrap">
              {displayedCharacters.map((character) => {
                const tooltipLabel = character.name;

                return (
                  <CharacterPortrait
                    key={`${character.name}-${character.quality}`}
                    name={character.name}
                    size={44}
                    quality={character.quality}
                    assetKey={getCharacterRouteSlug(character)}
                    routePath={getCharacterRoutePath(character)}
                    link
                    tooltip={tooltipLabel}
                    tooltipProps={tooltipProps}
                  />
                );
              })}
              {!showAllCharacters && remainingRecommendedCount > 0 && (
                <Badge
                  variant="light"
                  color="gray"
                  size="sm"
                  style={CURSOR_POINTER_STYLE}
                  onClick={() => setShowAllCharacters(true)}
                >
                  +{remainingRecommendedCount} more
                </Badge>
              )}
              {showAllCharacters && recommendedCharacters.length > 4 && (
                <Badge
                  variant="light"
                  color="gray"
                  size="sm"
                  style={CURSOR_POINTER_STYLE}
                  onClick={() => setShowAllCharacters(false)}
                >
                  Show less
                </Badge>
              )}
            </Group>
          </Stack>
        )}
      </DetailPageHero>

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {setItems.map((item) => {
              const iconSrc = getGearIcon(item.type, item.slug);
              const itemQualityColor = QUALITY_COLOR[item.quality];
              return (
                <Paper
                  key={item.name}
                  p="md"
                  radius="md"
                  withBorder
                  {...getCardHoverProps({
                    style: {
                      borderTop: `3px solid var(--mantine-color-${itemQualityColor}-${isDark ? 7 : 5})`,
                    },
                  })}
                >
                  <Stack gap="sm">
                    <Group gap="md" wrap="nowrap" align="flex-start">
                      {iconSrc && (
                        <SafeImage
                          src={iconSrc}
                          alt={item.name}
                          w={64}
                          h={64}
                          fit="contain"
                          radius="sm"
                          loading="lazy"
                        />
                      )}
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          fw={700}
                          size="lg"
                          className="dt-link-text"
                          lineClamp={1}
                        >
                          {item.name}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          <GearTypeTag type={item.type} />
                          <QualityIcon
                            quality={item.quality}
                            size={IMAGE_SIZE.ICON_LG}
                          />
                        </Group>
                        <ExpandableText size="sm">
                          <RichText text={item.lore} statusEffects={statusEffects} italic />
                        </ExpandableText>
                      </Stack>
                    </Group>

                    <Stack gap="xs">
                      <Text fw={600} size="sm">
                        Stats
                      </Text>
                      <SimpleGrid cols={2} spacing="xs">
                        {Object.entries(item.stats).map(
                          ([statName, statValue]) => (
                            <Paper
                              key={statName}
                              withBorder
                              radius="sm"
                              p="xs"
                              {...getCardHoverProps()}
                            >
                              <Stack gap={2}>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {statName}
                                </Text>
                                <Text size="sm" fw={700} lineClamp={1}>
                                  {String(statValue)}
                                </Text>
                              </Stack>
                            </Paper>
                          )
                        )}
                      </SimpleGrid>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Stack>

        <ChangeHistory
          history={setData ? changesData[setData.slug] : undefined}
          extraHistories={gearItemHistories}
        />

        <DetailPageNavigation
          previousItem={
            previousSet
              ? {
                  label: `${previousSet.name} Set`,
                  path: `/gear-sets/${previousSet.slug}`,
                }
              : null
          }
          nextItem={
            nextSet
              ? {
                  label: `${nextSet.name} Set`,
                  path: `/gear-sets/${nextSet.slug}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
