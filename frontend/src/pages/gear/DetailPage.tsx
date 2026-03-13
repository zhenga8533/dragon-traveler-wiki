import { getGearIcon } from '@/assets/gear';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import {
  GEAR_TYPE_ORDER,
  QUALITY_COLOR,
  QUALITY_ORDER,
} from '@/constants/colors';
import { getLoreGlassStyles } from '@/constants/glass';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  getCardHoverProps,
  getDetailHeroGradient,
} from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import QualityIcon from '@/features/characters/components/QualityIcon';
import type { Character } from '@/features/characters/types';
import {
  buildCharacterNameCounts,
  getCharacterBaseSlug,
} from '@/features/characters/utils/character-route';
import GearTypeTag from '@/features/wiki/components/GearTypeTag';
import type { Gear, GearSet } from '@/features/wiki/types/gear';
import {
  useDarkMode,
  useDataFetch,
  useGradientAccent,
  useMobileTooltip,
} from '@/hooks';
import type { ChangesFile } from '@/types/changes';
import type { Quality } from '@/types/quality';
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
  Image,
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
  const { data: gear, loading } = useDataFetch<Gear[]>('data/gear.json', []);
  const { data: gearSets } = useDataFetch<GearSet[]>('data/gear_sets.json', []);
  const { data: characters } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: changesData } = useDataFetch<ChangesFile>(
    'data/changes/gear_sets.json',
    {}
  );
  const { data: gearChangesData } = useDataFetch<ChangesFile>(
    'data/changes/gear.json',
    {}
  );

  const decodedSetName = useMemo(() => {
    const fromSetData = findEntityByParam(
      gearSets,
      setName,
      (entry) => entry.name
    );
    if (fromSetData) return fromSetData.name;
    const setNamesFromGear = [...new Set(gear.map((item) => item.set))];
    return findEntityByParam(setNamesFromGear, setName, (value) => value) ?? '';
  }, [gear, gearSets, setName]);

  const setData = useMemo(
    () =>
      gearSets.find(
        (entry) => entry.name.toLowerCase() === decodedSetName.toLowerCase()
      ) ?? null,
    [decodedSetName, gearSets]
  );

  useEffect(() => {
    if (!decodedSetName || !setName) return;
    if (!shouldRedirectToEntitySlug(setName, decodedSetName)) return;
    navigate(`/gear-sets/${toEntitySlug(decodedSetName)}`, { replace: true });
  }, [decodedSetName, navigate, setName]);

  const setItems = useMemo(() => {
    if (!decodedSetName) return [];
    return gear
      .filter((item) => item.set.toLowerCase() === decodedSetName.toLowerCase())
      .sort((a, b) => {
        const typeCmp =
          GEAR_TYPE_ORDER.indexOf(a.type) - GEAR_TYPE_ORDER.indexOf(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
  }, [decodedSetName, gear]);

  const gearItemHistories = useMemo(() => {
    return setItems
      .filter((item) => gearChangesData[item.name])
      .map((item) => ({
        label: item.name,
        history: gearChangesData[item.name],
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

  const characterNameCounts = useMemo(
    () => buildCharacterNameCounts(characters),
    [characters]
  );

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

  // Match list page: sort by name
  const orderedSetNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...gearSets.map((entry) => entry.name),
          ...gear.map((item) => item.set),
        ])
      ).sort((a, b) => a.localeCompare(b)),
    [gearSets, gear]
  );

  const setIndex = useMemo(() => {
    if (!decodedSetName) return -1;
    return orderedSetNames.findIndex(
      (entry) => entry.toLowerCase() === decodedSetName.toLowerCase()
    );
  }, [decodedSetName, orderedSetNames]);

  const previousSetName = setIndex > 0 ? orderedSetNames[setIndex - 1] : null;
  const nextSetName =
    setIndex >= 0 && setIndex < orderedSetNames.length - 1
      ? orderedSetNames[setIndex + 1]
      : null;

  if (loading) {
    return (
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DetailPageLoading />
      </Container>
    );
  }

  if (!decodedSetName || setItems.length === 0) {
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
  const qualityColor = QUALITY_COLOR[setItems[0].quality] ?? 'grape';
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
      <Box style={DETAIL_HERO_WRAPPER_STYLES}>
        <Box style={getDetailHeroGradient(isDark, qualityColor)} />

        <Container
          size="lg"
          style={{ position: 'relative', zIndex: 1 }}
          py={{ base: 'lg', sm: 'xl' }}
        >
          <Stack gap="lg">
            <Breadcrumbs
              items={[
                { label: 'Gear', path: '/gear' },
                { label: decodedSetName },
              ]}
            />

            <Stack gap={6}>
              <Group gap="sm" align="center" wrap="wrap">
                <Title
                  order={1}
                  c={isDark ? 'white' : 'dark'}
                  fz={{ base: '1.5rem', sm: '2.125rem' }}
                  style={{ wordBreak: 'break-word' }}
                >
                  {decodedSetName} Set
                </Title>
                <Badge variant="light" color={accent.secondary} size="lg">
                  {setItems.length} item{setItems.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
              <LastUpdated timestamp={lastUpdatedTimestamp} />
              {setBonus && setBonus.quantity > 0 && (
                <Text c="dimmed" size="sm">
                  {setBonus.quantity}-piece set bonus: {setBonus.description}
                </Text>
              )}
              {recommendedStats !== null && (
                <Text size="sm" c="dimmed">
                  Recommended for{' '}
                  <Text span fw={600} c={`${accent.primary}.7`}>
                    {recommendedStats.count}
                  </Text>{' '}
                  of {recommendedStats.total} SSR and above characters (
                  {recommendedStats.percentage}%)
                </Text>
              )}
            </Stack>

            <Group gap="xs" wrap="wrap">
              <QualityIcon quality={setItems[0].quality} size={20} />
              {setBonus && setBonus.quantity > 0 && (
                <Badge variant="outline" color={accent.tertiary} size="md">
                  {setBonus.quantity}-piece bonus
                </Badge>
              )}
            </Group>

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
                    {setBonus.description}
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
                    const isMultiQualityCharacter =
                      (characterNameCounts.get(
                        getCharacterBaseSlug(character.name)
                      ) ?? 1) > 1;
                    const tooltipLabel = isMultiQualityCharacter
                      ? `${character.name} (${character.quality})`
                      : character.name;

                    return (
                      <CharacterPortrait
                        key={`${character.name}-${character.quality}`}
                        name={character.name}
                        size={44}
                        quality={character.quality}
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
                      style={{ cursor: 'pointer' }}
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
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowAllCharacters(false)}
                    >
                      Show less
                    </Badge>
                  )}
                </Group>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {setItems.map((item) => {
              const iconSrc = getGearIcon(item.type, item.name);
              return (
                <Paper
                  key={item.name}
                  p="md"
                  radius="md"
                  withBorder
                  {...getCardHoverProps()}
                >
                  <Stack gap="sm">
                    <Group gap="md" wrap="nowrap" align="flex-start">
                      {iconSrc && (
                        <Image
                          src={iconSrc}
                          alt={item.name}
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
                          c={`${accent.primary}.7`}
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
                        <Text size="sm" c="dimmed" fs="italic" lineClamp={2}>
                          {item.lore}
                        </Text>
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
          history={changesData[decodedSetName]}
          extraHistories={gearItemHistories}
        />

        <DetailPageNavigation
          previousItem={
            previousSetName
              ? {
                  label: `${previousSetName} Set`,
                  path: `/gear-sets/${toEntitySlug(previousSetName)}`,
                }
              : null
          }
          nextItem={
            nextSetName
              ? {
                  label: `${nextSetName} Set`,
                  path: `/gear-sets/${toEntitySlug(nextSetName)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
