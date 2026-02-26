import {
  Alert,
  Badge,
  Box,
  Card,
  Collapse,
  Container,
  Divider,
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
import { useMemo, useState } from 'react';
import {
  IoCalendar,
  IoChevronDown,
  IoChevronUp,
  IoCopy,
  IoDiamond,
  IoHeart,
  IoInformationCircleOutline,
  IoPeople,
  IoStar,
  IoStatsChart,
  IoTime,
} from 'react-icons/io5';
import { QUALITY_ICON_MAP } from '../assets/quality';
import StatCard from '../components/common/StatCard';
import { getGlassStyles } from '../constants/glass';
import { BRAND_TITLE_STYLE } from '../constants/styles';
import { TRANSITION } from '../constants/ui';

type StarTier = 'base' | 'purple' | 'red' | 'legendary' | 'divine';

type StarLevel = {
  label: string;
  stars: number;
  value: string;
  copies: number;
  fodder: number;
  divineCrystals: number;
  tier: StarTier;
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

const TIER_BADGE_COLORS: Record<StarTier, string> = {
  base: 'gray',
  purple: 'grape',
  red: 'red',
  legendary: 'cyan',
  divine: 'orange',
};

const HEART_TRIAL_RATES = {
  'SSR EX': 1,
  'SSR+': 3,
  SSR: 6,
  SR: 15,
} as const;

const SHARDS_PER_DUPE = 60;

type QualityOption = keyof typeof HEART_TRIAL_RATES;

function parseNumberInput(value: string | number): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function StarUpgradeCalculator() {
  const isDark = useComputedColorScheme('dark') === 'dark';
  const [currentValue, setCurrentValue] = useState<string>(
    STAR_LEVELS[0].value
  );
  const [targetValue, setTargetValue] = useState<string>(
    STAR_LEVELS[STAR_LEVELS.length - 1].value
  );
  const [quality, setQuality] = useState<QualityOption>('SSR');
  const [affectionLevel20, setAffectionLevel20] = useState<boolean>(false);
  const [currentCopies, setCurrentCopies] = useState<number | null>(0);
  const [currentShards, setCurrentShards] = useState<number | null>(0);
  const [refTableOpened, refTableHandlers] = useDisclosure(false);

  const currentIndex = STAR_LEVELS.findIndex(
    (level) => level.value === currentValue
  );
  const targetIndex = STAR_LEVELS.findIndex(
    (level) => level.value === targetValue
  );

  const currentLevel = STAR_LEVELS[currentIndex] ?? STAR_LEVELS[0];
  const targetLevel =
    STAR_LEVELS[targetIndex] ?? STAR_LEVELS[STAR_LEVELS.length - 1];

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

  const shardsPerDay = useMemo(() => {
    if (quality === 'SSR EX' && affectionLevel20) return 2;
    return HEART_TRIAL_RATES[quality];
  }, [quality, affectionLevel20]);

  const effectiveCopiesNeeded =
    quality === 'SR' ? copiesNeeded * 2 : copiesNeeded;
  const totalShardsNeeded = effectiveCopiesNeeded * SHARDS_PER_DUPE;
  const safeCurrentCopies = currentCopies ?? 0;
  const safeCurrentShards = currentShards ?? 0;
  const ownedShards = Math.max(
    0,
    safeCurrentCopies * SHARDS_PER_DUPE + safeCurrentShards
  );
  const shardsRemaining = Math.max(0, totalShardsNeeded - ownedShards);

  const shardProgress =
    totalShardsNeeded > 0
      ? Math.min(
          100,
          (Math.min(ownedShards, totalShardsNeeded) / totalShardsNeeded) * 100
        )
      : 0;

  const daysNeeded =
    shardsPerDay > 0 ? Math.ceil(shardsRemaining / shardsPerDay) : 0;
  const weeksNeeded = daysNeeded > 0 ? (daysNeeded / 7).toFixed(1) : '0';
  const monthsNeeded = daysNeeded > 0 ? (daysNeeded / 30).toFixed(1) : '0';
  const yearsNeeded = daysNeeded > 0 ? (daysNeeded / 365).toFixed(1) : '0';

  const completionDate = useMemo(() => {
    if (daysNeeded <= 0) return '';
    const date = new Date();
    date.setDate(date.getDate() + daysNeeded);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [daysNeeded]);

  const levelOptions = STAR_LEVELS.map((level) => ({
    value: level.value,
    label: `${level.label} • ${level.copies} copies / ${level.fodder} fodder`,
  }));

  const sectionCardStyle = {
    ...getGlassStyles(isDark, true),
    boxShadow: isDark
      ? '0 10px 28px rgba(0, 0, 0, 0.28)'
      : '0 8px 24px rgba(124, 58, 237, 0.08)',
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Card
          withBorder
          radius="md"
          p="xl"
          style={{
            ...sectionCardStyle,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.22), transparent 55%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.2), transparent 50%)'
                : 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.16), transparent 55%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.14), transparent 50%)',
              pointerEvents: 'none',
            }}
          />

          <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size="xl" radius="md" variant="light" color="violet">
                <IoStar size={20} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={1} style={BRAND_TITLE_STYLE}>
                  Star Upgrade Calculator
                </Title>
                <Text size="sm" c="dimmed">
                  Plan your upgrade path, shard farming timeline, and required
                  resources.
                </Text>
              </Stack>
            </Group>

            <Alert
              variant="light"
              color="blue"
              icon={<IoInformationCircleOutline />}
              title="How to use"
            >
              Pick your current and target star levels first. The calculator
              shows cumulative requirements, then estimates farming time based
              on your selected quality and current shard stock.
            </Alert>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="md">
            <Title order={3}>
              <Group gap="xs">
                <IoStar />
                Upgrade Requirements
              </Group>
            </Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Select
                label="Current Star Level"
                data={levelOptions}
                value={currentValue}
                onChange={(value) =>
                  setCurrentValue(value ?? STAR_LEVELS[0].value)
                }
                searchable
                nothingFoundMessage="No level found"
              />
              <Select
                label="Target Star Level"
                data={levelOptions}
                value={targetValue}
                onChange={(value) =>
                  setTargetValue(
                    value ?? STAR_LEVELS[STAR_LEVELS.length - 1].value
                  )
                }
                searchable
                nothingFoundMessage="No level found"
              />
            </SimpleGrid>

            {!isValidSelection ? (
              <Alert color="red" variant="light" title="Invalid selection">
                Target star level must be higher than current star level.
              </Alert>
            ) : (
              <>
                <Group gap="xs" wrap="wrap">
                  <Badge
                    color={TIER_BADGE_COLORS[currentLevel.tier]}
                    variant="light"
                    size="lg"
                  >
                    Current: {currentLevel.label}
                  </Badge>
                  <Badge
                    color={TIER_BADGE_COLORS[targetLevel.tier]}
                    variant="light"
                    size="lg"
                  >
                    Target: {targetLevel.label}
                  </Badge>
                </Group>

                <SimpleGrid
                  cols={{ base: 1, sm: divineCrystalsNeeded > 0 ? 3 : 2 }}
                  spacing="sm"
                >
                  <StatCard
                    icon={<IoCopy size={16} />}
                    title="5-Star Copies"
                    value={copiesNeeded}
                    color="blue"
                  />
                  <StatCard
                    icon={<IoPeople size={16} />}
                    title="6-Star Fodder"
                    value={fodderNeeded}
                    color="grape"
                  />
                  {divineCrystalsNeeded > 0 && (
                    <StatCard
                      icon={<IoDiamond size={16} />}
                      title="Divine Crystals"
                      value={divineCrystalsNeeded}
                      color="orange"
                    />
                  )}
                </SimpleGrid>
              </>
            )}
          </Stack>
        </Card>

        {isValidSelection && copiesNeeded > 0 && (
          <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
            <Stack gap="md">
              <Title order={3}>
                <Group gap="xs">
                  <IoHeart />
                  Heart Trial Estimator
                </Group>
              </Title>

              <Text size="sm" c="dimmed">
                Each dupe requires {SHARDS_PER_DUPE} shards. SR heart-trial
                yields 4-star copies, so SR paths are automatically converted to
                5-star equivalent costs.
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
                        h={18}
                        fit="contain"
                      />
                    ),
                  },
                  {
                    value: 'SSR+',
                    label: (
                      <Image
                        src={QUALITY_ICON_MAP['SSR+']}
                        h={18}
                        fit="contain"
                      />
                    ),
                  },
                  {
                    value: 'SSR',
                    label: (
                      <Image src={QUALITY_ICON_MAP.SSR} h={18} fit="contain" />
                    ),
                  },
                  {
                    value: 'SR',
                    label: (
                      <Image src={QUALITY_ICON_MAP.SR} h={18} fit="contain" />
                    ),
                  },
                ]}
                fullWidth
              />

              {quality === 'SSR EX' && (
                <Switch
                  label="Affection Level 20 (2 shards/day)"
                  checked={affectionLevel20}
                  onChange={(event) =>
                    setAffectionLevel20(event.currentTarget.checked)
                  }
                />
              )}

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <NumberInput
                  label="Current Copies"
                  description={`Full copies already owned (${SHARDS_PER_DUPE} shards each)`}
                  value={currentCopies ?? ''}
                  onChange={(value) =>
                    setCurrentCopies(parseNumberInput(value))
                  }
                  min={0}
                  step={1}
                  allowNegative={false}
                />
                <NumberInput
                  label="Current Shards"
                  description="Extra shards beyond full copies"
                  value={currentShards ?? ''}
                  onChange={(value) =>
                    setCurrentShards(
                      parseNumberInput(value) == null
                        ? null
                        : Math.max(
                            0,
                            Math.min(
                              SHARDS_PER_DUPE - 1,
                              parseNumberInput(value) ?? 0
                            )
                          )
                    )
                  }
                  min={0}
                  max={SHARDS_PER_DUPE - 1}
                  step={1}
                  allowNegative={false}
                />
              </SimpleGrid>

              <Stack gap={6}>
                <Group justify="space-between">
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
                />
              </Stack>

              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                <StatCard
                  icon={<IoTime size={16} />}
                  title="Days"
                  value={daysNeeded}
                  color="teal"
                />
                <StatCard
                  icon={<IoTime size={16} />}
                  title="Weeks"
                  value={Number(weeksNeeded)}
                  color="teal"
                />
                <StatCard
                  icon={<IoTime size={16} />}
                  title="Months"
                  value={Number(monthsNeeded)}
                  color="teal"
                />
                <StatCard
                  icon={<IoTime size={16} />}
                  title="Years"
                  value={Number(yearsNeeded)}
                  color="teal"
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                <Paper p="md" radius="md" withBorder>
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" ta="center">
                      Daily Shards
                    </Text>
                    <Text fw={700} size="lg">
                      {shardsPerDay}/day
                    </Text>
                  </Stack>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" ta="center">
                      Total Needed
                    </Text>
                    <Text fw={700} size="lg">
                      {totalShardsNeeded}
                    </Text>
                  </Stack>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" ta="center">
                      Remaining
                    </Text>
                    <Text fw={700} size="lg">
                      {shardsRemaining}
                    </Text>
                  </Stack>
                </Paper>
              </SimpleGrid>

              {daysNeeded > 0 && (
                <Paper p="md" radius="md" withBorder>
                  <Group gap="sm" wrap="nowrap">
                    <IoCalendar size={16} />
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Estimated completion date
                      </Text>
                      <Text fw={700}>{completionDate}</Text>
                    </Stack>
                  </Group>
                </Paper>
              )}

              <Divider />

              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Sweep Rate Reference
                </Text>
                <Table.ScrollContainer minWidth={320}>
                  <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th ta="center">Quality</Table.Th>
                        <Table.Th ta="center">Sweeps / Day</Table.Th>
                        <Table.Th ta="center">Shards / Day</Table.Th>
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
                        <Table.Td ta="center">1 (2 at Affection 20)</Table.Td>
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
                            src={QUALITY_ICON_MAP.SR}
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
            </Stack>
          </Card>
        )}

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <UnstyledButton onClick={refTableHandlers.toggle}>
              <Group justify="space-between" align="center">
                <Stack gap={2}>
                  <Title order={3}>
                    <Group gap="xs">
                      <IoStatsChart />
                      Star Upgrade Reference Table
                    </Group>
                  </Title>
                  <Text size="sm" c="dimmed">
                    Cumulative values from 5 Star base.
                  </Text>
                </Stack>
                {refTableOpened ? (
                  <IoChevronUp size={18} />
                ) : (
                  <IoChevronDown size={18} />
                )}
              </Group>
            </UnstyledButton>

            <Collapse
              in={refTableOpened}
              transitionDuration={parseInt(TRANSITION.NORMAL, 10)}
            >
              <Table.ScrollContainer minWidth={480}>
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
                    {STAR_LEVELS.map((level, index) => {
                      const inRange =
                        isValidSelection &&
                        index > currentIndex &&
                        index <= targetIndex;
                      const isCurrent = index === currentIndex;
                      const isTarget = index === targetIndex;

                      return (
                        <Table.Tr key={level.value}>
                          <Table.Td>
                            <Group gap="xs" wrap="wrap">
                              <Badge
                                color={TIER_BADGE_COLORS[level.tier]}
                                variant={isTarget ? 'filled' : 'light'}
                              >
                                {level.label}
                              </Badge>
                              {isCurrent && (
                                <Badge color="gray" variant="outline">
                                  Current
                                </Badge>
                              )}
                              {isTarget && (
                                <Badge color="green" variant="outline">
                                  Target
                                </Badge>
                              )}
                              {inRange && !isTarget && (
                                <Badge color="blue" variant="dot">
                                  In path
                                </Badge>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text
                              fw={isCurrent || isTarget || inRange ? 700 : 500}
                            >
                              {level.copies}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text
                              fw={isCurrent || isTarget || inRange ? 700 : 500}
                            >
                              {level.fodder}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text
                              fw={isCurrent || isTarget || inRange ? 700 : 500}
                            >
                              {level.divineCrystals > 0
                                ? level.divineCrystals
                                : '-'}
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
