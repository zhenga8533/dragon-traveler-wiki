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
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import {
  IoArrowForward,
  IoChevronDown,
  IoChevronUp,
  IoCopy,
  IoDiamond,
  IoPeople,
} from 'react-icons/io5';
import { QUALITY_ICON_MAP } from '../assets/character_quality';
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
  'SR+': 15, // 3 sweeps for 15 shards
  R: 0, // Not farmable
  N: 0, // Not farmable
} as const;

const SHARDS_PER_DUPE = 60;

type QualityOption = 'SSR EX' | 'SSR+' | 'SSR' | 'SR+';

// ---------------------------------------------------------------------------
// Star icon helper
// ---------------------------------------------------------------------------

function StarIcon({ level, size = 20 }: { level: StarLevel; size?: number }) {
  return (
    <Box
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={TIER_COLORS[level.tier]}
        style={{ display: 'block' }}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {level.stars > 0 && (
        <Text
          size="xs"
          fw={700}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textShadow: '0 0 3px rgba(0,0,0,0.8)',
            lineHeight: 1,
            fontSize: size > 20 ? '0.65rem' : '0.6rem',
          }}
        >
          {level.stars}
        </Text>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Progress indicator between current and target
// ---------------------------------------------------------------------------

function ProgressIndicator({
  currentIndex,
  targetIndex,
}: {
  currentIndex: number;
  targetIndex: number;
}) {
  const currentLevel = STAR_LEVELS[currentIndex];
  const targetLevel = STAR_LEVELS[targetIndex];
  const isValid = currentIndex < targetIndex;

  return (
    <Group justify="center" gap="lg" py="xs">
      <Stack gap={2} align="center">
        <StarIcon level={currentLevel} size={36} />
        <Badge
          color={TIER_BADGE_COLORS[currentLevel.tier]}
          variant="light"
          size="sm"
        >
          {currentLevel.label}
        </Badge>
      </Stack>
      <IoArrowForward
        size={24}
        style={{
          color: isValid
            ? TIER_COLORS[targetLevel.tier]
            : 'var(--mantine-color-red-6)',
          flexShrink: 0,
        }}
      />
      <Stack gap={2} align="center">
        <StarIcon level={targetLevel} size={36} />
        <Badge
          color={TIER_BADGE_COLORS[targetLevel.tier]}
          variant="light"
          size="sm"
        >
          {targetLevel.label}
        </Badge>
      </Stack>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Star range selector
// ---------------------------------------------------------------------------

const TIER_GROUPS = (() => {
  const tiers: { tier: StarLevel['tier']; label: string; levels: { level: StarLevel; index: number }[] }[] = [];
  let current: (typeof tiers)[number] | null = null;
  STAR_LEVELS.forEach((level, index) => {
    if (!current || current.tier !== level.tier) {
      const tierLabel =
        level.tier === 'base'
          ? 'Base'
          : level.tier.charAt(0).toUpperCase() + level.tier.slice(1);
      current = { tier: level.tier, label: tierLabel, levels: [] };
      tiers.push(current);
    }
    current.levels.push({ level, index });
  });
  return tiers;
})();

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
  const [mode, setMode] = useState<'from' | 'to'>('from');

  const handleClick = (index: number) => {
    if (mode === 'from') {
      if (index >= targetIndex) return;
      onCurrentChange(index);
      setMode('to');
    } else {
      if (index <= currentIndex) return;
      onTargetChange(index);
      setMode('from');
    }
  };

  return (
    <Stack gap="sm">
      <SegmentedControl
        value={mode}
        onChange={(val) => setMode(val as 'from' | 'to')}
        data={[
          { value: 'from', label: 'Setting: From' },
          { value: 'to', label: 'Setting: To' },
        ]}
        size="xs"
        color={mode === 'from' ? 'blue' : TIER_BADGE_COLORS[STAR_LEVELS[targetIndex].tier]}
      />
      {TIER_GROUPS.map((group) => (
        <Box
          key={group.tier}
          style={{
            borderLeft: `3px solid ${TIER_COLORS[group.tier]}`,
            borderRadius: '4px',
            paddingLeft: 8,
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            {group.label}
          </Text>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(80px, 1fr))`,
              gap: 4,
            }}
          >
            {group.levels.map(({ level, index }) => {
              const isCurrent = index === currentIndex;
              const isTarget = index === targetIndex;
              const inRange =
                currentIndex < targetIndex &&
                index > currentIndex &&
                index < targetIndex;

              return (
                <UnstyledButton
                  key={level.value}
                  onClick={() => handleClick(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: isCurrent
                      ? '2px solid var(--mantine-color-blue-6)'
                      : isTarget
                        ? `2px solid ${TIER_COLORS[level.tier]}`
                        : '2px solid transparent',
                    background: isTarget
                      ? `var(--mantine-color-${TIER_BADGE_COLORS[level.tier]}-light)`
                      : isCurrent
                        ? 'var(--mantine-color-blue-light)'
                        : inRange
                          ? isDark
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.03)'
                          : 'transparent',
                    transition: 'all 150ms ease',
                    cursor: 'pointer',
                  }}
                >
                  <StarIcon level={level} size={18} />
                  <Text
                    size="xs"
                    fw={isCurrent || isTarget ? 700 : 500}
                    c={isCurrent || isTarget ? undefined : 'dimmed'}
                  >
                    {level.stars > 0 ? level.stars : level.label}
                  </Text>
                  {isCurrent && (
                    <Badge size="xs" color="blue" variant="light">
                      From
                    </Badge>
                  )}
                  {isTarget && (
                    <Badge
                      size="xs"
                      color={TIER_BADGE_COLORS[level.tier]}
                      variant="filled"
                    >
                      To
                    </Badge>
                  )}
                </UnstyledButton>
              );
            })}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StarUpgradeCalculator() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [targetIndex, setTargetIndex] = useState<number>(
    STAR_LEVELS.length - 1,
  );
  const [quality, setQuality] = useState<QualityOption>('SSR');
  const [affectionLevel20, setAffectionLevel20] = useState<boolean>(false);
  const [currentCopies, setCurrentCopies] = useState<number>(0);
  const [currentShards, setCurrentShards] = useState<number>(0);
  const [refTableOpened, refTableHandlers] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
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

  // SR+ only gives 4-star copies, need 2x 4-star to make 1x 5-star
  const effectiveCopiesNeeded =
    quality === 'SR+' ? copiesNeeded * 2 : copiesNeeded;
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
        <div>
          <Title order={1}>Star Upgrade Calculator</Title>
          <Text c="dimmed">
            Calculate resources needed for character star upgrades.
          </Text>
        </div>

        {/* Calculator Card */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={3}>Resource Calculator</Title>

            <StarRangeSelector
              currentIndex={currentIndex}
              targetIndex={targetIndex}
              onCurrentChange={setCurrentIndex}
              onTargetChange={setTargetIndex}
            />

            {/* Progress indicator */}
            <ProgressIndicator
              currentIndex={currentIndex}
              targetIndex={targetIndex}
            />

            {isValidSelection ? (
              <SimpleGrid cols={{ base: 2, sm: divineCrystalsNeeded > 0 ? 3 : 2 }} spacing="md">
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
                    <ThemeIcon variant="light" color="blue" size="lg" radius="md">
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
                    <ThemeIcon variant="light" color="grape" size="lg" radius="md">
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
                      <ThemeIcon variant="light" color="orange" size="lg" radius="md">
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
                <Title order={3}>Heart Trial Time Calculator</Title>
                <Text size="sm" c="dimmed">
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
                      value: 'SR+',
                      label: (
                        <Image
                          src={QUALITY_ICON_MAP['SR+']}
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

              {quality === 'SR+' && (
                <Paper p="sm" withBorder bg="var(--mantine-color-yellow-light)">
                  <Text size="sm" c="orange">
                    Note: SR+ heart trial gives 4-star copies. You need 2×
                    4-star to make 1× 5-star (calculation accounts for this)
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
                    {Math.min(ownedShards, totalShardsNeeded)} / {totalShardsNeeded} ({shardProgress.toFixed(1)}%)
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
                  <Title order={4}>Time Required</Title>

                  <Box>
                    <Text size="sm" c="dimmed">
                      Daily shards from sweeps
                    </Text>
                    <Text size="lg" fw={700}>
                      {shardsPerDay} shards/day
                    </Text>
                  </Box>

                  <Box>
                    <Text size="sm" c="dimmed">
                      Total shards needed
                    </Text>
                    <Text size="lg" fw={700}>
                      {totalShardsNeeded} shards
                      <Text span size="sm" fw={400} c="dimmed" ml={4}>
                        ({copiesNeeded} dupes × {SHARDS_PER_DUPE} shards)
                      </Text>
                    </Text>
                  </Box>

                  <Box>
                    <Text size="sm" c="dimmed">
                      Shards remaining
                    </Text>
                    <Text size="lg" fw={700}>
                      {shardsRemaining} shards
                    </Text>
                  </Box>

                  <Box
                    p="md"
                    style={{
                      borderRadius: '8px',
                      background: 'var(--mantine-color-body)',
                    }}
                  >
                    {isMobile ? (
                      <Stack gap="sm">
                        <Group gap="lg" grow>
                          <div>
                            <Text size="sm" c="dimmed" ta="center">
                              Days
                            </Text>
                            <Text size="xl" fw={700} ta="center">
                              {daysNeeded}
                            </Text>
                          </div>
                          <div>
                            <Text size="sm" c="dimmed" ta="center">
                              Weeks
                            </Text>
                            <Text size="xl" fw={700} ta="center">
                              {weeksNeeded}
                            </Text>
                          </div>
                        </Group>
                        <Group gap="lg" grow>
                          <div>
                            <Text size="sm" c="dimmed" ta="center">
                              Months
                            </Text>
                            <Text size="xl" fw={700} ta="center">
                              {monthsNeeded}
                            </Text>
                          </div>
                          <div>
                            <Text size="sm" c="dimmed" ta="center">
                              Years
                            </Text>
                            <Text size="xl" fw={700} ta="center">
                              {yearsNeeded}
                            </Text>
                          </div>
                        </Group>
                      </Stack>
                    ) : (
                      <Group gap="xl" grow>
                        <div>
                          <Text size="sm" c="dimmed" ta="center">
                            Days
                          </Text>
                          <Text size="2rem" fw={700} ta="center">
                            {daysNeeded}
                          </Text>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed" ta="center">
                            Weeks
                          </Text>
                          <Text size="2rem" fw={700} ta="center">
                            {weeksNeeded}
                          </Text>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed" ta="center">
                            Months
                          </Text>
                          <Text size="2rem" fw={700} ta="center">
                            {monthsNeeded}
                          </Text>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed" ta="center">
                            Years
                          </Text>
                          <Text size="2rem" fw={700} ta="center">
                            {yearsNeeded}
                          </Text>
                        </div>
                      </Group>
                    )}
                  </Box>

                  {daysNeeded > 0 && (
                    <Paper
                      p="md"
                      withBorder
                      style={{
                        background: 'var(--mantine-color-violet-light)',
                      }}
                    >
                      <Stack gap="xs">
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
                              src={QUALITY_ICON_MAP['SR+']}
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
                <div>
                  <Title order={3}>Star Upgrade Reference Table</Title>
                  <Text size="sm" c="dimmed">
                    All values are cumulative from 5 Star base
                  </Text>
                </div>
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
                            borderLeft: isInRange || isTarget
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
