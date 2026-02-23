import {
  Badge,
  Box,
  Card,
  Collapse,
  Container,
  Group,
  Image,
  NumberInput,
  Paper,
  Progress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import {
  IoCalculator,
  IoCalendar,
  IoChevronDown,
  IoChevronUp,
  IoCopy,
  IoDiamond,
  IoHeart,
  IoInformationCircle,
  IoPeople,
  IoStar,
  IoStatsChart,
  IoTime,
} from 'react-icons/io5';
import { QUALITY_ICON_MAP } from '../assets/quality';
import { TRANSITION } from '../constants/ui';

type StarLevel = {
  label: string;
  stars: number;
  value: string;
  copies: number;
  fodder: number;
  divineCrystals: number;
  tier: 'base' | 'purple' | 'red' | 'legendary' | 'divine';
};

const STAR_LEVELS: StarLevel[] = [
  {
    label: '5 Star',
    stars: 5,
    value: '5',
    copies: 1,
    fodder: 0,
    divineCrystals: 0,
    tier: 'base',
  },
  {
    label: '6 Star',
    stars: 6,
    value: '6',
    copies: 2,
    fodder: 0,
    divineCrystals: 0,
    tier: 'base',
  },
  {
    label: 'Purple 1',
    stars: 1,
    value: 'p1',
    copies: 2,
    fodder: 1,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 2',
    stars: 2,
    value: 'p2',
    copies: 4,
    fodder: 2,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 3',
    stars: 3,
    value: 'p3',
    copies: 4,
    fodder: 4,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 4',
    stars: 4,
    value: 'p4',
    copies: 6,
    fodder: 6,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 5',
    stars: 5,
    value: 'p5',
    copies: 6,
    fodder: 9,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 6',
    stars: 6,
    value: 'p6',
    copies: 8,
    fodder: 12,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Red 1',
    stars: 1,
    value: 'r1',
    copies: 8,
    fodder: 16,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 2',
    stars: 2,
    value: 'r2',
    copies: 10,
    fodder: 20,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 3',
    stars: 3,
    value: 'r3',
    copies: 10,
    fodder: 24,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 4',
    stars: 4,
    value: 'r4',
    copies: 12,
    fodder: 27,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 5',
    stars: 5,
    value: 'r5',
    copies: 12,
    fodder: 30,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 6',
    stars: 6,
    value: 'r6',
    copies: 14,
    fodder: 34,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Legendary',
    stars: 0,
    value: 'legendary',
    copies: 18,
    fodder: 40,
    divineCrystals: 0,
    tier: 'legendary',
  },
  {
    label: 'Divine 1',
    stars: 1,
    value: 'd1',
    copies: 20,
    fodder: 40,
    divineCrystals: 2,
    tier: 'divine',
  },
  {
    label: 'Divine 2',
    stars: 2,
    value: 'd2',
    copies: 22,
    fodder: 40,
    divineCrystals: 5,
    tier: 'divine',
  },
  {
    label: 'Divine 3',
    stars: 3,
    value: 'd3',
    copies: 24,
    fodder: 40,
    divineCrystals: 8,
    tier: 'divine',
  },
  {
    label: 'Divine 4',
    stars: 4,
    value: 'd4',
    copies: 28,
    fodder: 40,
    divineCrystals: 12,
    tier: 'divine',
  },
  {
    label: 'Divine 5',
    stars: 5,
    value: 'd5',
    copies: 32,
    fodder: 40,
    divineCrystals: 17,
    tier: 'divine',
  },
];

const TIER_COLORS = {
  base: '#718096',
  purple: '#805AD5',
  red: '#E53E3E',
  legendary: '#06B6D4',
  divine: '#F59E0B',
} as const;

const TIER_BADGE_COLORS = {
  base: 'gray',
  purple: 'grape',
  red: 'red',
  legendary: 'cyan',
  divine: 'orange',
} as const;

// Heart Trial sweep rates - shards per day
const HEART_TRIAL_RATES = {
  'SSR EX': 1, // 2 sweeps for 1 shard (2 if affection 20)
  'SSR+': 3, // 3 sweeps for 3 shards
  SSR: 6, // 3 sweeps for 6 shards
  SR: 15, // 3 sweeps for 15 shards
  R: 0, // Not farmable
  N: 0, // Not farmable
} as const;

const SHARDS_PER_DUPE = 60;

type QualityOption = 'SSR EX' | 'SSR+' | 'SSR' | 'SR';

// ---------------------------------------------------------------------------
// Star icon helper
// ---------------------------------------------------------------------------

function StarIcon({ level, size = 20 }: { level: StarLevel; size?: number }) {
  const badgeSize = Math.max(12, Math.round(size * 0.46));

  return (
    <Box
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
      }}
    >
      <IoStar
        size={size}
        style={{
          color: TIER_COLORS[level.tier],
          display: 'block',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))',
        }}
      />

      {(level.stars > 0 || level.tier === 'legendary') && (
        <Box
          style={{
            position: 'absolute',
            right: -Math.max(2, Math.round(size * 0.08)),
            bottom: -Math.max(2, Math.round(size * 0.08)),
            minWidth: badgeSize,
            height: badgeSize,
            paddingInline: Math.max(3, Math.round(size * 0.12)),
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(255,255,255,0.22)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
          }}
        >
          <Text
            fw={800}
            style={{
              color: 'white',
              lineHeight: 1,
              fontSize: `${Math.max(8, Math.round(size * 0.33))}px`,
              letterSpacing: 0.1,
            }}
          >
            {level.stars > 0 ? level.stars : 'L'}
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Star range selector
// ---------------------------------------------------------------------------

type StarRangeSelectorProps = {
  currentIndex: number;
  targetIndex: number;
  onCurrentChange: (value: number) => void;
  onTargetChange: (value: number) => void;
};

function StarRangeSelector({
  currentIndex,
  targetIndex,
  onCurrentChange,
  onTargetChange,
}: StarRangeSelectorProps) {
  const colorScheme = useComputedColorScheme('light');
  const isDark = colorScheme === 'dark';

  const renderStarOption = ({
    option,
  }: {
    option: { value: string; label: string };
  }) => {
    const level = STAR_LEVELS[Number(option.value)];
    return (
      <Group justify="space-between" wrap="nowrap" w="100%" gap="xs">
        <Group wrap="nowrap" gap={8}>
          <StarIcon level={level} size={16} />
          <Text size="sm">{option.label}</Text>
        </Group>
        <Badge size="xs" color={TIER_BADGE_COLORS[level.tier]} variant="light">
          {level.tier}
        </Badge>
      </Group>
    );
  };

  const rangeSpan = targetIndex - currentIndex;
  const rangePercent =
    STAR_LEVELS.length > 1 ? (rangeSpan / (STAR_LEVELS.length - 1)) * 100 : 0;

  const fromOptions = STAR_LEVELS.map((level, index) => ({
    value: String(index),
    label: level.label,
  })).filter((option) => Number(option.value) < targetIndex);

  const toOptions = STAR_LEVELS.map((level, index) => ({
    value: String(index),
    label: level.label,
  })).filter((option) => Number(option.value) > currentIndex);

  const quickPresetIndexes = [0, 1, 7, 13, 14, STAR_LEVELS.length - 1].filter(
    (value, idx, arr) => arr.indexOf(value) === idx
  );

  const coreQuickPresetIndexes = quickPresetIndexes.filter((index) => {
    const tier = STAR_LEVELS[index].tier;
    return tier !== 'legendary' && tier !== 'divine';
  });

  const endgameQuickPresetIndexes = quickPresetIndexes.filter((index) => {
    const tier = STAR_LEVELS[index].tier;
    return tier === 'legendary' || tier === 'divine';
  });

  return (
    <Stack gap="md">
      <Paper
        withBorder
        p="sm"
        radius="md"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.04))',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <div>
            <Text fw={600} size="sm">
              Select star range
            </Text>
            <Text size="xs" c="dimmed">
              Use From and To dropdowns for a cleaner, faster selection flow.
            </Text>
          </div>
          <Group gap={6}>
            <Badge size="sm" color="blue" variant="light">
              From: {STAR_LEVELS[currentIndex].label}
            </Badge>
            <Badge
              size="sm"
              color={TIER_BADGE_COLORS[STAR_LEVELS[targetIndex].tier]}
              variant="light"
            >
              To: {STAR_LEVELS[targetIndex].label}
            </Badge>
          </Group>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Select
          label="From"
          description="Current star level"
          value={String(currentIndex)}
          data={fromOptions}
          renderOption={renderStarOption}
          searchable={fromOptions.length >= 10}
          allowDeselect={false}
          nothingFoundMessage="No levels available"
          leftSection={<StarIcon level={STAR_LEVELS[currentIndex]} size={16} />}
          onChange={(value) => {
            if (!value) return;
            const nextFrom = Number(value);
            onCurrentChange(nextFrom);
            if (nextFrom >= targetIndex) {
              onTargetChange(Math.min(STAR_LEVELS.length - 1, nextFrom + 1));
            }
          }}
        />

        <Select
          label="To"
          description="Target star level"
          value={String(targetIndex)}
          data={toOptions}
          renderOption={renderStarOption}
          searchable={toOptions.length >= 10}
          allowDeselect={false}
          nothingFoundMessage="No levels available"
          leftSection={<StarIcon level={STAR_LEVELS[targetIndex]} size={16} />}
          onChange={(value) => {
            if (!value) return;
            const nextTo = Number(value);
            onTargetChange(nextTo);
            if (nextTo <= currentIndex) {
              onCurrentChange(Math.max(0, nextTo - 1));
            }
          }}
        />
      </SimpleGrid>

      <Paper withBorder p="sm" radius="md">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Range span
            </Text>
            <Text size="xs" fw={600}>
              {rangeSpan} step{rangeSpan === 1 ? '' : 's'}
            </Text>
          </Group>
          <Progress
            value={Math.max(0, Math.min(100, rangePercent))}
            size="md"
            radius="xl"
            color={TIER_BADGE_COLORS[STAR_LEVELS[targetIndex].tier]}
          />
        </Stack>
      </Paper>

      <Paper
        withBorder
        p="xs"
        radius="md"
        style={{
          background: isDark
            ? 'rgba(99,102,241,0.08)'
            : 'rgba(99,102,241,0.06)',
        }}
      >
        <Stack gap={6}>
          <Text size="xs" c="dimmed" ta="center">
            Quick presets
          </Text>

          <Group gap="xs" justify="center" wrap="wrap">
            {coreQuickPresetIndexes.map((index) => {
              const level = STAR_LEVELS[index];
              const canSetFrom = index < targetIndex;
              const canSetTo = index > currentIndex;
              const isFromActive = index === currentIndex;
              const isToActive = index === targetIndex;

              return (
                <Paper key={level.value} withBorder p={4} radius="xl">
                  <Group gap={4} wrap="nowrap">
                    <Group gap={6} wrap="nowrap" px={4}>
                      <StarIcon level={level} size={14} />
                      <Text size="xs" fw={600} c="dimmed">
                        {level.label}
                      </Text>
                    </Group>

                    <UnstyledButton
                      onClick={() => canSetFrom && onCurrentChange(index)}
                      disabled={!canSetFrom}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 8px',
                        borderRadius: 999,
                        border: isFromActive
                          ? '1px solid var(--mantine-color-blue-5)'
                          : '1px solid var(--mantine-color-default-border)',
                        background: isFromActive
                          ? 'var(--mantine-color-blue-light)'
                          : 'transparent',
                        opacity: canSetFrom ? 1 : 0.45,
                        cursor: canSetFrom ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Badge
                        size="xs"
                        color="blue"
                        variant={isFromActive ? 'filled' : 'light'}
                      >
                        From
                      </Badge>
                    </UnstyledButton>
                    <UnstyledButton
                      onClick={() => canSetTo && onTargetChange(index)}
                      disabled={!canSetTo}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 8px',
                        borderRadius: 999,
                        border: isToActive
                          ? `1px solid var(--mantine-color-${TIER_BADGE_COLORS[level.tier]}-5)`
                          : '1px solid var(--mantine-color-default-border)',
                        background: isToActive
                          ? `var(--mantine-color-${TIER_BADGE_COLORS[level.tier]}-light)`
                          : 'transparent',
                        opacity: canSetTo ? 1 : 0.45,
                        cursor: canSetTo ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Badge
                        size="xs"
                        color={TIER_BADGE_COLORS[level.tier]}
                        variant={isToActive ? 'filled' : 'light'}
                      >
                        To
                      </Badge>
                    </UnstyledButton>
                  </Group>
                </Paper>
              );
            })}
          </Group>

          {endgameQuickPresetIndexes.length > 0 && (
            <>
              <Text size="xs" c="dimmed" ta="center" mt={2}>
                Legendary & Divinity
              </Text>
              <Group gap="xs" justify="center" wrap="wrap">
                {endgameQuickPresetIndexes.map((index) => {
                  const level = STAR_LEVELS[index];
                  const canSetFrom = index < targetIndex;
                  const canSetTo = index > currentIndex;
                  const isFromActive = index === currentIndex;
                  const isToActive = index === targetIndex;

                  return (
                    <Paper key={level.value} withBorder p={4} radius="xl">
                      <Group gap={4} wrap="nowrap">
                        <Group gap={6} wrap="nowrap" px={4}>
                          <StarIcon level={level} size={14} />
                          <Text size="xs" fw={600} c="dimmed">
                            {level.label}
                          </Text>
                        </Group>

                        <UnstyledButton
                          onClick={() => canSetFrom && onCurrentChange(index)}
                          disabled={!canSetFrom}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 8px',
                            borderRadius: 999,
                            border: isFromActive
                              ? '1px solid var(--mantine-color-blue-5)'
                              : '1px solid var(--mantine-color-default-border)',
                            background: isFromActive
                              ? 'var(--mantine-color-blue-light)'
                              : 'transparent',
                            opacity: canSetFrom ? 1 : 0.45,
                            cursor: canSetFrom ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <Badge
                            size="xs"
                            color="blue"
                            variant={isFromActive ? 'filled' : 'light'}
                          >
                            From
                          </Badge>
                        </UnstyledButton>
                        <UnstyledButton
                          onClick={() => canSetTo && onTargetChange(index)}
                          disabled={!canSetTo}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 8px',
                            borderRadius: 999,
                            border: isToActive
                              ? `1px solid var(--mantine-color-${TIER_BADGE_COLORS[level.tier]}-5)`
                              : '1px solid var(--mantine-color-default-border)',
                            background: isToActive
                              ? `var(--mantine-color-${TIER_BADGE_COLORS[level.tier]}-light)`
                              : 'transparent',
                            opacity: canSetTo ? 1 : 0.45,
                            cursor: canSetTo ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <Badge
                            size="xs"
                            color={TIER_BADGE_COLORS[level.tier]}
                            variant={isToActive ? 'filled' : 'light'}
                          >
                            To
                          </Badge>
                        </UnstyledButton>
                      </Group>
                    </Paper>
                  );
                })}
              </Group>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StarUpgradeCalculator() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [targetIndex, setTargetIndex] = useState<number>(
    STAR_LEVELS.length - 1
  );
  const [quality, setQuality] = useState<QualityOption>('SSR');
  const [affectionLevel20, setAffectionLevel20] = useState<boolean>(false);
  const [currentCopies, setCurrentCopies] = useState<number>(0);
  const [currentShards, setCurrentShards] = useState<number>(0);
  const [refTableOpened, refTableHandlers] = useDisclosure(false);
  const colorScheme = useComputedColorScheme('light');
  const isDark = colorScheme === 'dark';

  const currentLevel = STAR_LEVELS[currentIndex];
  const targetLevel = STAR_LEVELS[targetIndex];

  const isValidSelection = currentIndex < targetIndex;
  const copiesNeeded = isValidSelection
    ? targetLevel.copies - currentLevel.copies
    : 0;
  const fodderNeeded = isValidSelection
    ? targetLevel.fodder - currentLevel.fodder
    : 0;
  const divineCrystalsNeeded = isValidSelection
    ? targetLevel.divineCrystals - currentLevel.divineCrystals
    : 0;

  // Calculate heart trial time
  let shardsPerDay: number = HEART_TRIAL_RATES[quality];
  if (quality === 'SSR EX' && affectionLevel20) {
    shardsPerDay = 2;
  }

  // SR only gives 4-star copies, need 2x 4-star to make 1x 5-star
  const effectiveCopiesNeeded =
    quality === 'SR' ? copiesNeeded * 2 : copiesNeeded;
  const totalShardsNeeded = effectiveCopiesNeeded * SHARDS_PER_DUPE;
  const ownedShards = currentCopies * SHARDS_PER_DUPE + currentShards;
  const shardsRemaining = Math.max(0, totalShardsNeeded - ownedShards);
  const shardProgress =
    totalShardsNeeded > 0
      ? Math.min(100, (ownedShards / totalShardsNeeded) * 100)
      : 0;
  const daysNeeded =
    shardsPerDay > 0 ? Math.ceil(shardsRemaining / shardsPerDay) : 0;
  const weeksNeeded = daysNeeded > 0 ? (daysNeeded / 7).toFixed(1) : 0;
  const monthsNeeded = daysNeeded > 0 ? (daysNeeded / 30).toFixed(1) : 0;
  const yearsNeeded = daysNeeded > 0 ? (daysNeeded / 365).toFixed(1) : 0;

  // Calculate completion date (starting from tomorrow)
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysNeeded);
  const formattedDate =
    daysNeeded > 0
      ? completionDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group gap="md" align="center">
          <ThemeIcon variant="light" color="violet" size="xl" radius="md">
            <IoCalculator size={24} />
          </ThemeIcon>
          <div>
            <Title order={1}>Star Upgrade Calculator</Title>
            <Text c="dimmed">
              Calculate resources needed for character star upgrades.
            </Text>
          </div>
        </Group>

        {/* Calculator Card */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Group gap="sm" align="center">
              <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                <IoStar size={18} />
              </ThemeIcon>
              <Title order={3}>Resource Calculator</Title>
            </Group>

            <StarRangeSelector
              currentIndex={currentIndex}
              targetIndex={targetIndex}
              onCurrentChange={setCurrentIndex}
              onTargetChange={setTargetIndex}
            />

            {isValidSelection ? (
              <SimpleGrid
                cols={{ base: 2, sm: divineCrystalsNeeded > 0 ? 3 : 2 }}
                spacing="md"
              >
                <Paper
                  p="md"
                  withBorder
                  radius="md"
                  style={{
                    borderColor: `var(--mantine-color-blue-${isDark ? '8' : '3'})`,
                    background: `var(--mantine-color-blue-light)`,
                  }}
                >
                  <Stack gap="xs" align="center">
                    <ThemeIcon
                      variant="light"
                      color="blue"
                      size="lg"
                      radius="md"
                    >
                      <IoCopy size={18} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed" ta="center">
                      5-Star Copies
                    </Text>
                    <Text size="xl" fw={700} ta="center">
                      {copiesNeeded}
                    </Text>
                  </Stack>
                </Paper>
                <Paper
                  p="md"
                  withBorder
                  radius="md"
                  style={{
                    borderColor: `var(--mantine-color-grape-${isDark ? '8' : '3'})`,
                    background: `var(--mantine-color-grape-light)`,
                  }}
                >
                  <Stack gap="xs" align="center">
                    <ThemeIcon
                      variant="light"
                      color="grape"
                      size="lg"
                      radius="md"
                    >
                      <IoPeople size={18} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed" ta="center">
                      6-Star Fodder
                    </Text>
                    <Text size="xl" fw={700} ta="center">
                      {fodderNeeded}
                    </Text>
                  </Stack>
                </Paper>
                {divineCrystalsNeeded > 0 && (
                  <Paper
                    p="md"
                    withBorder
                    radius="md"
                    style={{
                      borderColor: `var(--mantine-color-orange-${isDark ? '8' : '3'})`,
                      background: `var(--mantine-color-orange-light)`,
                    }}
                  >
                    <Stack gap="xs" align="center">
                      <ThemeIcon
                        variant="light"
                        color="orange"
                        size="lg"
                        radius="md"
                      >
                        <IoDiamond size={18} />
                      </ThemeIcon>
                      <Text size="xs" c="dimmed" ta="center">
                        Divine Crystals
                      </Text>
                      <Text size="xl" fw={700} ta="center">
                        {divineCrystalsNeeded}
                      </Text>
                    </Stack>
                  </Paper>
                )}
              </SimpleGrid>
            ) : (
              <Paper p="md" withBorder bg="var(--mantine-color-red-light)">
                <Text c="red" ta="center">
                  Target star level must be higher than current star level
                </Text>
              </Paper>
            )}
          </Stack>
        </Card>

        {/* Heart Trial Time Calculator */}
        {isValidSelection && copiesNeeded > 0 && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="lg">
              <div>
                <Group gap="sm" align="center">
                  <ThemeIcon variant="light" color="pink" size="lg" radius="md">
                    <IoHeart size={18} />
                  </ThemeIcon>
                  <Title order={3}>Heart Trial Time Calculator</Title>
                </Group>
                <Text size="sm" c="dimmed" mt={4}>
                  Calculate time needed to farm dupes via heart trial sweeps.
                  Each dupe requires {SHARDS_PER_DUPE} shards.
                </Text>
              </div>

              <Box>
                <Text size="sm" fw={500} mb="xs">
                  Character Quality
                </Text>
                <SegmentedControl
                  value={quality}
                  onChange={(value) => setQuality(value as QualityOption)}
                  data={[
                    {
                      value: 'SSR EX',
                      label: (
                        <Image
                          src={QUALITY_ICON_MAP['SSR EX']}
                          h={20}
                          fit="contain"
                        />
                      ),
                    },
                    {
                      value: 'SSR+',
                      label: (
                        <Image
                          src={QUALITY_ICON_MAP['SSR+']}
                          h={20}
                          fit="contain"
                        />
                      ),
                    },
                    {
                      value: 'SSR',
                      label: (
                        <Image
                          src={QUALITY_ICON_MAP.SSR}
                          h={20}
                          fit="contain"
                        />
                      ),
                    },
                    {
                      value: 'SR',
                      label: (
                        <Image
                          src={QUALITY_ICON_MAP['SR']}
                          h={20}
                          fit="contain"
                        />
                      ),
                    },
                  ]}
                  fullWidth
                />
              </Box>

              {quality === 'SSR EX' && (
                <Switch
                  label="Affection Level 20 (2 shards/day instead of 1)"
                  checked={affectionLevel20}
                  onChange={(event) =>
                    setAffectionLevel20(event.currentTarget.checked)
                  }
                />
              )}

              {quality === 'SR' && (
                <Paper p="sm" withBorder bg="var(--mantine-color-yellow-light)">
                  <Text size="sm" c="orange">
                    Note: SR heart trial gives 4-star copies. You need 2× 4-star
                    to make 1× 5-star (calculation accounts for this)
                  </Text>
                </Paper>
              )}

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <NumberInput
                  label="Current Copies"
                  description={`Copies you already own (${SHARDS_PER_DUPE} shards each)`}
                  value={currentCopies}
                  onChange={(value) => setCurrentCopies(Number(value) || 0)}
                  min={0}
                  step={1}
                  allowNegative={false}
                />
                <NumberInput
                  label="Current Shards"
                  description="Extra shards beyond full copies"
                  value={currentShards}
                  onChange={(value) => setCurrentShards(Number(value) || 0)}
                  min={0}
                  max={SHARDS_PER_DUPE - 1}
                  step={1}
                  allowNegative={false}
                />
              </SimpleGrid>

              {/* Shard progress bar */}
              <Box>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    Shard Progress
                  </Text>
                  <Text size="xs" c="dimmed">
                    {Math.min(ownedShards, totalShardsNeeded)} /{' '}
                    {totalShardsNeeded} ({shardProgress.toFixed(1)}%)
                  </Text>
                </Group>
                <Progress
                  value={shardProgress}
                  size="lg"
                  radius="md"
                  color={shardProgress >= 100 ? 'teal' : 'violet'}
                  animated={shardProgress > 0 && shardProgress < 100}
                />
              </Box>

              <Paper p="md" withBorder bg="var(--mantine-color-teal-light)">
                <Stack gap="md">
                  <Group gap="sm" align="center">
                    <ThemeIcon
                      variant="light"
                      color="teal"
                      size="md"
                      radius="md"
                    >
                      <IoTime size={16} />
                    </ThemeIcon>
                    <Title order={4}>Time Required</Title>
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                    <Paper p="sm" withBorder radius="md">
                      <Stack gap={4} align="center">
                        <Text size="xs" c="dimmed" ta="center">
                          Daily Shards
                        </Text>
                        <Text size="lg" fw={700} ta="center">
                          {shardsPerDay}/day
                        </Text>
                      </Stack>
                    </Paper>
                    <Paper p="sm" withBorder radius="md">
                      <Stack gap={4} align="center">
                        <Text size="xs" c="dimmed" ta="center">
                          Total Needed
                        </Text>
                        <Text size="lg" fw={700} ta="center">
                          {totalShardsNeeded}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                          ({copiesNeeded} dupes × {SHARDS_PER_DUPE})
                        </Text>
                      </Stack>
                    </Paper>
                    <Paper p="sm" withBorder radius="md">
                      <Stack gap={4} align="center">
                        <Text size="xs" c="dimmed" ta="center">
                          Remaining
                        </Text>
                        <Text size="lg" fw={700} ta="center">
                          {shardsRemaining}
                        </Text>
                      </Stack>
                    </Paper>
                  </SimpleGrid>

                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                    {[
                      { label: 'Days', value: daysNeeded },
                      { label: 'Weeks', value: weeksNeeded },
                      { label: 'Months', value: monthsNeeded },
                      { label: 'Years', value: yearsNeeded },
                    ].map((stat) => (
                      <Paper
                        key={stat.label}
                        p="md"
                        withBorder
                        radius="md"
                        style={{ background: 'var(--mantine-color-body)' }}
                      >
                        <Stack gap={4} align="center">
                          <Text size="sm" c="dimmed" ta="center">
                            {stat.label}
                          </Text>
                          <Text size="xl" fw={700} ta="center">
                            {stat.value}
                          </Text>
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>

                  {daysNeeded > 0 && (
                    <Paper
                      p="md"
                      withBorder
                      radius="md"
                      style={{
                        background: 'var(--mantine-color-violet-light)',
                        borderColor: `var(--mantine-color-violet-${isDark ? '8' : '4'})`,
                      }}
                    >
                      <Stack gap="xs" align="center">
                        <ThemeIcon
                          variant="light"
                          color="violet"
                          size="lg"
                          radius="md"
                        >
                          <IoCalendar size={18} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed" ta="center">
                          Goal Completion Date
                        </Text>
                        <Text size="xl" fw={700} ta="center">
                          {formattedDate}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                          (Assuming you start collecting tomorrow)
                        </Text>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Paper>

              <Paper p="md" withBorder radius="md">
                <Stack gap="sm">
                  <Group gap="sm" align="center">
                    <ThemeIcon
                      variant="light"
                      color="cyan"
                      size="md"
                      radius="md"
                    >
                      <IoInformationCircle size={16} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">
                      Sweep Rates Reference
                    </Text>
                  </Group>
                  <Table.ScrollContainer minWidth={300}>
                    <Table withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th ta="center">Quality</Table.Th>
                          <Table.Th ta="center">Sweeps/Day</Table.Th>
                          <Table.Th ta="center">Shards/Day</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td>
                            <Image
                              src={QUALITY_ICON_MAP['SSR EX']}
                              h={20}
                              fit="contain"
                            />
                          </Table.Td>
                          <Table.Td ta="center">2</Table.Td>
                          <Table.Td ta="center">1 (2 at Aff. 20)</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Image
                              src={QUALITY_ICON_MAP['SSR+']}
                              h={20}
                              fit="contain"
                            />
                          </Table.Td>
                          <Table.Td ta="center">3</Table.Td>
                          <Table.Td ta="center">3</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Image
                              src={QUALITY_ICON_MAP.SSR}
                              h={20}
                              fit="contain"
                            />
                          </Table.Td>
                          <Table.Td ta="center">3</Table.Td>
                          <Table.Td ta="center">6</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Image
                              src={QUALITY_ICON_MAP['SR']}
                              h={20}
                              fit="contain"
                            />
                          </Table.Td>
                          <Table.Td ta="center">3</Table.Td>
                          <Table.Td ta="center">15</Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Paper>
            </Stack>
          </Card>
        )}

        {/* Reference Table (collapsible) */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <UnstyledButton
              onClick={refTableHandlers.toggle}
              style={{ width: '100%' }}
            >
              <Group justify="space-between">
                <Group gap="sm" align="flex-start">
                  <ThemeIcon
                    variant="light"
                    color="cyan"
                    size="lg"
                    radius="md"
                    mt={2}
                  >
                    <IoStatsChart size={18} />
                  </ThemeIcon>
                  <div>
                    <Title order={3}>Star Upgrade Reference Table</Title>
                    <Text size="sm" c="dimmed">
                      All values are cumulative from 5 Star base
                    </Text>
                  </div>
                </Group>
                <ThemeIcon variant="subtle" color="gray" size="lg">
                  {refTableOpened ? (
                    <IoChevronUp size={20} />
                  ) : (
                    <IoChevronDown size={20} />
                  )}
                </ThemeIcon>
              </Group>
            </UnstyledButton>

            <Collapse
              in={refTableOpened}
              transitionDuration={parseInt(TRANSITION.NORMAL)}
            >
              <Table.ScrollContainer minWidth={400}>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Star Level</Table.Th>
                      <Table.Th ta="right">5 Star Copies</Table.Th>
                      <Table.Th ta="right">6 Star Fodder</Table.Th>
                      <Table.Th ta="right">Divine Crystals</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {STAR_LEVELS.map((star, idx) => {
                      const isInRange =
                        isValidSelection &&
                        idx > currentIndex &&
                        idx <= targetIndex;
                      const isCurrent = idx === currentIndex;
                      const isTarget = idx === targetIndex;
                      return (
                        <Table.Tr
                          key={star.value}
                          style={{
                            background: isTarget
                              ? `var(--mantine-color-${TIER_BADGE_COLORS[star.tier]}-light)`
                              : isCurrent
                                ? `var(--mantine-color-gray-light)`
                                : isInRange
                                  ? isDark
                                    ? 'rgba(255,255,255,0.03)'
                                    : 'rgba(0,0,0,0.02)'
                                  : undefined,
                            borderLeft:
                              isInRange || isTarget
                                ? `3px solid var(--mantine-color-${TIER_BADGE_COLORS[star.tier]}-6)`
                                : isCurrent
                                  ? '3px solid var(--mantine-color-gray-6)'
                                  : '3px solid transparent',
                          }}
                        >
                          <Table.Td>
                            <Group gap="xs">
                              <Badge
                                color={TIER_BADGE_COLORS[star.tier]}
                                variant={isTarget ? 'filled' : 'light'}
                              >
                                {star.label}
                              </Badge>
                              {isCurrent && (
                                <Text size="xs" c="dimmed" fs="italic">
                                  current
                                </Text>
                              )}
                              {isTarget && (
                                <Text size="xs" c="dimmed" fs="italic">
                                  target
                                </Text>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text fw={isInRange || isTarget ? 700 : 500}>
                              {star.copies}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text fw={isInRange || isTarget ? 700 : 500}>
                              {star.fodder}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text fw={isInRange || isTarget ? 700 : 500}>
                              {star.divineCrystals || '-'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Collapse>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
