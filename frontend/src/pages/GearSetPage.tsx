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
import { useParams } from 'react-router-dom';
import { getPortrait } from '../assets/character';
import { getGearIcon } from '../assets/gear';
import { QUALITY_ICON_MAP } from '../assets/quality';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import GearTypeTag from '../components/common/GearTypeTag';
import EntityNotFound from '../components/common/EntityNotFound';
import LastUpdated from '../components/common/LastUpdated';
import { DetailPageLoading } from '../components/layout/PageLoadingSkeleton';
import { QUALITY_COLOR, QUALITY_ORDER } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
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
      <Box
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--mantine-color-body)',
          margin:
            'calc(-1 * var(--mantine-spacing-md)) calc(-1 * var(--mantine-spacing-md)) 0',
          padding: 'var(--mantine-spacing-md) var(--mantine-spacing-md) 0',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? `radial-gradient(ellipse at 30% 20%, var(--mantine-color-${qualityColor}-9) 0%, transparent 50%),
                 radial-gradient(ellipse at 70% 80%, var(--mantine-color-violet-9) 0%, transparent 50%),
                 var(--mantine-color-dark-8)`
              : `radial-gradient(ellipse at 30% 20%, var(--mantine-color-${qualityColor}-1) 0%, transparent 50%),
                 radial-gradient(ellipse at 70% 80%, var(--mantine-color-violet-1) 0%, transparent 50%),
                 var(--mantine-color-gray-0)`,
            opacity: isDark ? 0.7 : 0.9,
          }}
        />

        <Container
          size="lg"
          style={{ position: 'relative', zIndex: 1 }}
          py="xl"
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
              <Badge variant="light" color={qualityColor} size="md">
                {setItems[0].quality} quality
              </Badge>
              {setBonus && setBonus.quantity > 0 && (
                <Badge variant="light" color="violet" size="md">
                  {setBonus.quantity}-piece bonus
                </Badge>
              )}
            </Group>

            {setBonus && setBonus.quantity > 0 && (
              <Paper
                p="md"
                radius="md"
                style={{
                  background: isDark
                    ? 'rgba(0,0,0,0.25)'
                    : 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(8px)',
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(0,0,0,0.06)',
                }}
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
                    const portrait = getPortrait(character.name);

                    return (
                      <Tooltip
                        key={character.name}
                        label={`${character.name} (${character.quality})`}
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
                      </Tooltip>
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
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Text fw={700} size="lg" c="violet" lineClamp={1}>
                          {item.name}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          <GearTypeTag type={item.type} />
                          {QUALITY_ICON_MAP[item.quality] && (
                            <Tooltip label={item.quality}>
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
      </Container>
    </Box>
  );
}
