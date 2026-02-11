import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Image,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Switch,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import { QUALITY_ICON_MAP } from '../assets/character_quality';

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

type StarSelectorProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function StarSelector({ label, value, onChange }: StarSelectorProps) {
  const selectedLevel = STAR_LEVELS[value];
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Helper to render a star icon with optional number
  const renderStarIcon = (level: StarLevel, size: number = 20) => (
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

  // On mobile, show Select dropdown; on desktop, show slider
  if (isMobile) {
    return (
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            {label}
          </Text>
          <Badge color={TIER_BADGE_COLORS[selectedLevel.tier]} size="lg">
            {selectedLevel.label}
          </Badge>
        </Group>

        <Select
          value={value.toString()}
          onChange={(val) => onChange(Number(val))}
          data={STAR_LEVELS.map((level, index) => ({
            value: index.toString(),
            label: level.label,
          }))}
          renderOption={({ option }) => {
            const level = STAR_LEVELS[Number(option.value)];
            return (
              <Group gap="sm">
                {renderStarIcon(level, 24)}
                <Text>{level.label}</Text>
              </Group>
            );
          }}
          styles={{
            input: {
              fontWeight: 600,
            },
          }}
          allowDeselect={false}
          leftSection={renderStarIcon(selectedLevel, 20)}
        />
      </Stack>
    );
  }

  // Desktop: Show slider with star marks
  const marks = STAR_LEVELS.map((level, index) => ({
    value: index,
    label: (
      <Box style={{ position: 'relative', display: 'inline-block' }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={TIER_COLORS[level.tier]}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        {level.stars > 0 && (
          <Text
            size="xs"
            fw={700}
            style={{
              position: 'absolute',
              top: '48%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              textShadow: '0 0 3px rgba(0,0,0,0.5)',
              lineHeight: 1,
            }}
          >
            {level.stars}
          </Text>
        )}
      </Box>
    ),
  }));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <Badge color={TIER_BADGE_COLORS[selectedLevel.tier]} size="lg">
          {selectedLevel.label}
        </Badge>
      </Group>
      <Box px="xs" pb="xl">
        <Slider
          value={value}
          onChange={onChange}
          min={0}
          max={STAR_LEVELS.length - 1}
          step={1}
          marks={marks}
          styles={{
            markLabel: { marginTop: 8 },
            mark: { display: 'none' },
            thumb: {
              width: 20,
              height: 20,
            },
          }}
          color={TIER_BADGE_COLORS[selectedLevel.tier]}
        />
      </Box>
    </Stack>
  );
}

export default function StarUpgradeCalculator() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [targetIndex, setTargetIndex] = useState<number>(
    STAR_LEVELS.length - 1
  );
  const [quality, setQuality] = useState<QualityOption>('SSR');
  const [affectionLevel20, setAffectionLevel20] = useState<boolean>(false);
  const [currentShards, setCurrentShards] = useState<number>(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

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
  const shardsRemaining = Math.max(0, totalShardsNeeded - currentShards);
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

            <StarSelector
              label="Current Star Level"
              value={currentIndex}
              onChange={setCurrentIndex}
            />

            <StarSelector
              label="Target Star Level"
              value={targetIndex}
              onChange={setTargetIndex}
            />

            {isValidSelection ? (
              <Paper p="md" withBorder bg="var(--mantine-color-blue-light)">
                <Stack gap="sm">
                  <Title order={4}>Resources Needed</Title>
                  <Group gap="xl">
                    <div>
                      <Text size="sm" c="dimmed">
                        5 Star Copies
                      </Text>
                      <Text size="xl" fw={700}>
                        {copiesNeeded}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" c="dimmed">
                        6 Star Fodder
                      </Text>
                      <Text size="xl" fw={700}>
                        {fodderNeeded}
                      </Text>
                    </div>
                    {divineCrystalsNeeded > 0 && (
                      <div>
                        <Text size="sm" c="dimmed">
                          Divine Crystals
                        </Text>
                        <Text size="xl" fw={700}>
                          {divineCrystalsNeeded}
                        </Text>
                      </div>
                    )}
                  </Group>
                </Stack>
              </Paper>
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

              <NumberInput
                label="Current Shards"
                description="How many shards do you already have?"
                value={currentShards}
                onChange={(value) => setCurrentShards(Number(value) || 0)}
                min={0}
                max={totalShardsNeeded}
                step={1}
                allowNegative={false}
              />

              <Paper p="md" withBorder bg="var(--mantine-color-teal-light)">
                <Stack gap="md">
                  <Title order={4}>Time Required</Title>

                  <Group gap="xs" align="baseline">
                    <Text size="sm" c="dimmed">
                      Daily shards from sweeps:
                    </Text>
                    <Text size="lg" fw={700}>
                      {shardsPerDay} shards/day
                    </Text>
                  </Group>

                  <Group gap="xs" align="baseline">
                    <Text size="sm" c="dimmed">
                      Total shards needed:
                    </Text>
                    <Text size="lg" fw={700}>
                      {totalShardsNeeded} shards
                    </Text>
                    <Text size="sm" c="dimmed">
                      ({copiesNeeded} dupes × {SHARDS_PER_DUPE} shards)
                    </Text>
                  </Group>

                  <Group gap="xs" align="baseline">
                    <Text size="sm" c="dimmed">
                      Shards remaining:
                    </Text>
                    <Text size="lg" fw={700}>
                      {shardsRemaining} shards
                    </Text>
                  </Group>

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
                </Stack>
              </Paper>
            </Stack>
          </Card>
        )}

        {/* Reference Table */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Star Upgrade Reference Table</Title>
            <Text size="sm" c="dimmed">
              All values are cumulative from 5 Star base
            </Text>

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
                  {STAR_LEVELS.map((star) => (
                    <Table.Tr key={star.value}>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge
                            color={TIER_BADGE_COLORS[star.tier]}
                            variant="light"
                          >
                            {star.label}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500}>{star.copies}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500}>{star.fodder}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500}>{star.divineCrystals || '-'}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
