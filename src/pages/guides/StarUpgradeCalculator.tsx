import SafeImage from '@/components/ui/SafeImage';
import { QUALITY_ICON_MAP } from '@/assets';
import { parseNumberInput } from '@/utils';
import StatCard from '@/components/ui/StatCard';
import { getCardHoverProps } from '@/constants/styles';
import { IMAGE_SIZE, TRANSITION } from '@/constants/ui';
import { useGradientAccent, useStarLevels } from '@/hooks';
import type { StarTier } from '@/types/star-level';
import { buildStarLevels } from '@/types/star-level';
import {
  Alert,
  Badge,
  Card,
  Collapse,
  Container,
  Divider,
  Group,
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
  Title,
  UnstyledButton,
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
import GuideHeroCard from './components/GuideHeroCard';

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

export default function StarUpgradeCalculator() {
  const { accent } = useGradientAccent();
  const { data: rawStarLevels } = useStarLevels();
  const starLevels = useMemo(() => buildStarLevels(rawStarLevels), [rawStarLevels]);

  const [currentValue, setCurrentValue] = useState<string>('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [quality, setQuality] = useState<QualityOption>('SSR');
  const [affectionLevel20, setAffectionLevel20] = useState<boolean>(false);
  const [currentCopies, setCurrentCopies] = useState<number | null>(0);
  const [currentShards, setCurrentShards] = useState<number | null>(0);
  const [refTableOpened, refTableHandlers] = useDisclosure(false);

  // Fall back to first/last level when data loads or user hasn't selected yet
  const effectiveCurrentValue = currentValue || (starLevels[0]?.value ?? '');
  const effectiveTargetValue =
    targetValue || (starLevels[starLevels.length - 1]?.value ?? '');

  const currentIndex = starLevels.findIndex(
    (level) => level.value === effectiveCurrentValue
  );
  const targetIndex = starLevels.findIndex(
    (level) => level.value === effectiveTargetValue
  );

  const currentLevel = starLevels[currentIndex] ?? starLevels[0];
  const targetLevel = starLevels[targetIndex] ?? starLevels[starLevels.length - 1];

  const isValidSelection = currentIndex >= 0 && targetIndex >= 0 && currentIndex < targetIndex;

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

  const levelOptions = starLevels.map((level) => ({
    value: level.value,
    label: `${level.label} • ${level.copies} copies / ${level.fodder} fodder`,
  }));

  return (
    <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <GuideHeroCard
          icon={<IoStar size={20} />}
          title="Star Upgrade Calculator"
          subtitle="Plan your upgrade path, shard farming timeline, and required resources."
        >
          <Alert
            variant="light"
            color={accent.primary}
            icon={<IoInformationCircleOutline />}
            title="How to use"
          >
            Pick your current and target star levels first. The calculator shows
            cumulative requirements, then estimates farming time based on your
            selected quality and current shard stock.
          </Alert>
        </GuideHeroCard>

        <Card withBorder radius="md" p="lg" {...getCardHoverProps()}>
          <Stack gap="md">
            <Title order={2} size="h3">
              <Group gap="xs">
                <IoStar />
                Upgrade Requirements
              </Group>
            </Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Select
                label="Current Star Level"
                data={levelOptions}
                value={effectiveCurrentValue}
                onChange={(value) =>
                  setCurrentValue(value ?? starLevels[0]?.value ?? '')
                }
                searchable
                nothingFoundMessage="No level found"
              />
              <Select
                label="Target Star Level"
                data={levelOptions}
                value={effectiveTargetValue}
                onChange={(value) =>
                  setTargetValue(
                    value ?? starLevels[starLevels.length - 1]?.value ?? ''
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
                    color={accent.primary}
                  />
                  <StatCard
                    icon={<IoPeople size={16} />}
                    title="6-Star Fodder"
                    value={fodderNeeded}
                    color={accent.secondary}
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
          <Card withBorder radius="md" p="lg" {...getCardHoverProps()}>
            <Stack gap="md">
              <Title order={2} size="h3">
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
                      <SafeImage
                        src={QUALITY_ICON_MAP['SSR EX']}
                        h={18}
                        fit="contain"
                      />
                    ),
                  },
                  {
                    value: 'SSR+',
                    label: (
                      <SafeImage
                        src={QUALITY_ICON_MAP['SSR+']}
                        h={18}
                        fit="contain"
                      />
                    ),
                  },
                  {
                    value: 'SSR',
                    label: (
                      <SafeImage src={QUALITY_ICON_MAP.SSR} h={18} fit="contain" />
                    ),
                  },
                  {
                    value: 'SR',
                    label: (
                      <SafeImage src={QUALITY_ICON_MAP.SR} h={18} fit="contain" />
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
                  color={shardProgress >= 100 ? 'teal' : accent.primary}
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
                <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" ta="center">
                      Daily Shards
                    </Text>
                    <Text fw={700} size="lg">
                      {shardsPerDay}/day
                    </Text>
                  </Stack>
                </Paper>
                <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" ta="center">
                      Total Needed
                    </Text>
                    <Text fw={700} size="lg">
                      {totalShardsNeeded}
                    </Text>
                  </Stack>
                </Paper>
                <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
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
                <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
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
                          <SafeImage
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
                          <SafeImage
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
                          <SafeImage
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
                          <SafeImage
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

        <Card withBorder radius="md" p="lg" {...getCardHoverProps()}>
          <Stack gap="sm">
            <UnstyledButton onClick={refTableHandlers.toggle}>
              <Group justify="space-between" align="center">
                <Stack gap={2}>
                  <Title order={2} size="h3">
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
                  <IoChevronUp size={IMAGE_SIZE.ICON_LG} />
                ) : (
                  <IoChevronDown size={IMAGE_SIZE.ICON_LG} />
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
                    {starLevels.map((level, index) => {
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
                                <Badge color={accent.primary} variant="dot">
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
