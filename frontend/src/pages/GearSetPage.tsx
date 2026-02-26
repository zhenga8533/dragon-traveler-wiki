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
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPortrait } from '../assets/character';
import { getGearIcon } from '../assets/gear';
import { QUALITY_ICON_MAP } from '../assets/quality';
import DetailPageNavigation from '../components/common/DetailPageNavigation';
import EntityNotFound from '../components/common/EntityNotFound';
import GearTypeTag from '../components/common/GearTypeTag';
import LastUpdated from '../components/common/LastUpdated';
import QualityBadge from '../components/common/QualityBadge';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { DetailPageLoading } from '../components/layout/PageLoadingSkeleton';
import { QUALITY_COLOR, QUALITY_ORDER } from '../constants/colors';
import { getLoreGlassStyles } from '../constants/glass';
import {
  CURSOR_POINTER_STYLE,
  DETAIL_HERO_WRAPPER_STYLES,
  FLEX_1_STYLE,
  LINK_RESET_STYLE,
  RELATIVE_Z1_STYLE,
  getDetailHeroGradient,
} from '../constants/styles';
import { TRANSITION } from '../constants/ui';
import { useDataFetch, useMobileTooltip } from '../hooks';
import type { Character } from '../types/character';
import type { Gear, GearSet, GearType } from '../types/gear';
import type { Quality } from '../types/quality';

const SSR_AND_ABOVE: Quality[] = ['UR', 'SSR EX', 'SSR+', 'SSR'];

const GEAR_TYPE_ORDER: GearType[] = [
  'Headgear',
  'Chestplate',
  'Bracers',
  'Boots',
  'Weapon',
  'Accessory',
];

export default function GearSetPage() {
  const { setName } = useParams<{ setName: string }>();
  const isDark = useComputedColorScheme('light') === 'dark';
  const tooltipProps = useMobileTooltip();
  const { data: gear, loading } = useDataFetch<Gear[]>('data/gear.json', []);
  const { data: gearSets } = useDataFetch<GearSet[]>('data/gear_sets.json', []);
  const { data: characters } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  const decodedSetName = setName ? decodeURIComponent(setName) : '';

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
      <Container size="lg" py="xl">
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

  const setData = gearSets.find(
    (entry) => entry.name.toLowerCase() === decodedSetName.toLowerCase()
  );
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

        <Container size="lg" style={RELATIVE_Z1_STYLE} py="xl">
          <Stack gap="lg">
            <Breadcrumbs
              items={[
                { label: 'Gear', path: '/gear' },
                { label: decodedSetName },
              ]}
            />

            <Stack gap={6}>
              <Group gap="sm" align="center" wrap="wrap">
                <Title order={1} c={isDark ? 'white' : 'dark'}>
                  {decodedSetName} Set
                </Title>
                <Badge variant="light" color="grape" size="lg">
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
                  <Text span fw={600} c="violet">
                    {recommendedStats.count}
                  </Text>{' '}
                  of {recommendedStats.total} SSR and above characters (
                  {recommendedStats.percentage}%)
                </Text>
              )}
            </Stack>

            <Group gap="xs" wrap="wrap">
              <QualityBadge quality={setItems[0].quality} size="md" />
              {setBonus && setBonus.quantity > 0 && (
                <Badge variant="light" color="violet" size="md">
                  {setBonus.quantity}-piece bonus
                </Badge>
              )}
            </Group>

            {setBonus && setBonus.quantity > 0 && (
              <Paper p="md" radius="md" style={getLoreGlassStyles(isDark)}>
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
                    const portrait = getPortrait(character.name);

                    return (
                      <Tooltip
                        key={character.name}
                        label={`${character.name} (${character.quality})`}
                        {...tooltipProps}
                      >
                        <Link
                          to={`/characters/${encodeURIComponent(character.name)}`}
                          style={LINK_RESET_STYLE}
                        >
                          <Box
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              border: `2px solid var(--mantine-color-${qualityColor}-${isDark ? 6 : 4})`,
                              background: isDark
                                ? 'rgba(0,0,0,0.25)'
                                : 'rgba(255,255,255,0.65)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              ...CURSOR_POINTER_STYLE,
                              transition: `transform ${TRANSITION.NORMAL} ${TRANSITION.EASE}, box-shadow ${TRANSITION.NORMAL} ${TRANSITION.EASE}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = `0 0 8px var(--mantine-color-${qualityColor}-${isDark ? 6 : 4})`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {portrait ? (
                              <Image
                                src={portrait}
                                alt={character.name}
                                w={44}
                                h={44}
                                fit="cover"
                                loading="lazy"
                              />
                            ) : (
                              <Text size="xs" fw={700}>
                                {character.name.slice(0, 2).toUpperCase()}
                              </Text>
                            )}
                          </Box>
                        </Link>
                      </Tooltip>
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
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {setItems.map((item) => {
              const iconSrc = getGearIcon(item.type, item.name);
              return (
                <Paper key={item.name} p="md" radius="md" withBorder>
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
                      <Stack gap={4} style={FLEX_1_STYLE}>
                        <Text fw={700} size="lg" c="violet" lineClamp={1}>
                          {item.name}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          <GearTypeTag type={item.type} />
                          {QUALITY_ICON_MAP[item.quality] && (
                            <Tooltip label={item.quality} {...tooltipProps}>
                              <Image
                                src={QUALITY_ICON_MAP[item.quality]}
                                alt={item.quality}
                                h={18}
                                w="auto"
                                fit="contain"
                              />
                            </Tooltip>
                          )}
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
                      <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="xs">
                        {Object.entries(item.stats).map(
                          ([statName, statValue]) => (
                            <Paper key={statName} withBorder radius="sm" p="xs">
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

        <DetailPageNavigation
          previousItem={
            previousSetName
              ? {
                  label: `${previousSetName} Set`,
                  path: `/gear-sets/${encodeURIComponent(previousSetName)}`,
                }
              : null
          }
          nextItem={
            nextSetName
              ? {
                  label: `${nextSetName} Set`,
                  path: `/gear-sets/${encodeURIComponent(nextSetName)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
