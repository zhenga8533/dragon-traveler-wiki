import {
  Alert,
  Card,
  Container,
  Divider,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import {
  IoDiamond,
  IoFlag,
  IoInformationCircleOutline,
  IoSparkles,
  IoStar,
} from 'react-icons/io5';
import ResourceBadge from '../components/common/ResourceBadge';
import StatCard from '../components/common/StatCard';

type DropRate = {
  chance: number;
  amount: number;
};

const MYTHIC_LUMINARY_SHARD_RATES: DropRate[] = [
  { chance: 0.07, amount: 5 },
  { chance: 0.13, amount: 3 },
  { chance: 0.06, amount: 2 },
  { chance: 0.14, amount: 1 },
];

const WISHING_LILY_RATES: DropRate[] = [
  { chance: 0.015, amount: 30 },
  { chance: 0.05, amount: 25 },
  { chance: 0.1, amount: 10 },
  { chance: 0.035, amount: 5 },
];

const SUBSTITUTE_DOLL_FRAGMENT_RATES: DropRate[] = [
  { chance: 0.02, amount: 10 },
  { chance: 0.1, amount: 8 },
  { chance: 0.273, amount: 5 },
];

const DIAMOND_RATES: DropRate[] = [
  { chance: 0.0001, amount: 30000 },
  { chance: 0.001, amount: 8888 },
  { chance: 0.0059, amount: 3000 },
];

// Each summon guarantees 5-9 Wishing Lilies (average: 7)
const GUARANTEED_WISHING_LILIES_PER_SUMMON = 7;

type Milestone = {
  summons: number;
  shards: number;
};

const MILESTONES: Milestone[] = [
  { summons: 10, shards: 2 },
  { summons: 30, shards: 3 },
  { summons: 60, shards: 4 },
  { summons: 90, shards: 6 },
  { summons: 150, shards: 10 },
  { summons: 240, shards: 15 },
  { summons: 300, shards: 20 },
];


function calculateExpectedValue(rates: DropRate[]): number {
  return rates.reduce((sum, rate) => sum + rate.chance * rate.amount, 0);
}

// Calculate expected value for guaranteed drops (rates normalized to 100%)
function calculateGuaranteedDropValue(rates: DropRate[]): number {
  const totalChance = rates.reduce((sum, rate) => sum + rate.chance, 0);
  return rates.reduce(
    (sum, rate) => sum + (rate.chance / totalChance) * rate.amount,
    0
  );
}

function calculateMilestoneRewards(summons: number): number {
  return MILESTONES.filter((m) => m.summons <= summons).reduce(
    (sum, m) => sum + m.shards,
    0
  );
}

export default function MythicSummonCalculator() {
  const [numSummons, setNumSummons] = useState<number>(100);
  const [currentPulls, setCurrentPulls] = useState<number>(0);
  const [targetShards, setTargetShards] = useState<number | null>(null);
  const [targetWishingLilies, setTargetWishingLilies] = useState<number | null>(
    null
  );
  const [targetSubstituteDolls, setTargetSubstituteDolls] = useState<
    number | null
  >(null);
  const [targetDiamonds, setTargetDiamonds] = useState<number | null>(null);

  const results = useMemo(() => {
    if (!numSummons || numSummons < 1) {
      return {
        mythicShards: 0,
        wishingLilies: 0,
        wishingLiliesFromRates: 0,
        wishingLiliesBonus: 0,
        substituteDollFragments: 0,
        diamonds: 0,
        milestoneShards: 0,
        totalMythicShards: 0,
        totalPulls: currentPulls,
        nextGuaranteedPull: 0,
      };
    }

    const totalPulls = currentPulls + numSummons;
    const nextGuaranteedPull = 5 - (totalPulls % 5 || 5);

    // Calculate mythic shards with guaranteed 5th pull mechanic
    // Every 5th pull guarantees a mythic shard drop (with normalized rates)
    const guaranteedMythicShardsValue = calculateGuaranteedDropValue(
      MYTHIC_LUMINARY_SHARD_RATES
    );

    // Count how many guaranteed pulls we get
    const firstGuaranteedPull = 5 - (currentPulls % 5);
    let guaranteedPulls = 0;

    if (numSummons >= firstGuaranteedPull) {
      guaranteedPulls = 1 + Math.floor((numSummons - firstGuaranteedPull) / 5);
    }

    const regularPulls = numSummons - guaranteedPulls;

    // Regular pulls have the normal drop rate
    const mythicShardsPerRegularSummon = calculateExpectedValue(
      MYTHIC_LUMINARY_SHARD_RATES
    );

    // Guaranteed pulls have 100% chance to get a mythic shard drop
    const mythicShardsFromRegular = mythicShardsPerRegularSummon * regularPulls;
    const mythicShardsFromGuaranteed =
      guaranteedMythicShardsValue * guaranteedPulls;
    const mythicShards = mythicShardsFromRegular + mythicShardsFromGuaranteed;

    const milestoneShards = calculateMilestoneRewards(totalPulls);
    const totalMythicShards = mythicShards + milestoneShards;

    const wishingLiliesPerSummon = calculateExpectedValue(WISHING_LILY_RATES);
    const substituteDollFragmentsPerSummon = calculateExpectedValue(
      SUBSTITUTE_DOLL_FRAGMENT_RATES
    );
    const diamondsPerSummon = calculateExpectedValue(DIAMOND_RATES);

    const wishingLiliesFromRates = wishingLiliesPerSummon * regularPulls;
    const wishingLiliesBonus =
      GUARANTEED_WISHING_LILIES_PER_SUMMON * numSummons;
    const totalWishingLilies = wishingLiliesFromRates + wishingLiliesBonus;

    return {
      mythicShards,
      wishingLilies: totalWishingLilies,
      wishingLiliesFromRates,
      wishingLiliesBonus,
      substituteDollFragments: substituteDollFragmentsPerSummon * regularPulls,
      diamonds: diamondsPerSummon * regularPulls,
      milestoneShards,
      totalMythicShards,
      totalPulls,
      nextGuaranteedPull,
    };
  }, [numSummons, currentPulls]);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find((m) => m.summons > results.totalPulls);
  }, [results.totalPulls]);

  // Reverse calculator
  const reverseResults = useMemo(() => {
    const requiredSummons: Record<string, number> = {};

    if (targetShards && targetShards > 0) {
      let accumulatedShards = 0;
      let summonCount = 0;
      while (accumulatedShards < targetShards) {
        summonCount++;
        const firstGuaranteedPull = 5 - (currentPulls % 5);
        let guaranteedPulls = 0;
        if (summonCount >= firstGuaranteedPull) {
          guaranteedPulls =
            1 + Math.floor((summonCount - firstGuaranteedPull) / 5);
        }
        const regularPulls = summonCount - guaranteedPulls;
        const shardPerRegular = calculateExpectedValue(
          MYTHIC_LUMINARY_SHARD_RATES
        );
        const shardPerGuaranteed = calculateGuaranteedDropValue(
          MYTHIC_LUMINARY_SHARD_RATES
        );
        accumulatedShards =
          shardPerRegular * regularPulls + shardPerGuaranteed * guaranteedPulls;
        accumulatedShards +=
          calculateMilestoneRewards(currentPulls + summonCount) -
          calculateMilestoneRewards(currentPulls);
      }
      requiredSummons['Mythic Luminary Shard'] = summonCount;
    }

    if (targetWishingLilies && targetWishingLilies > 0) {
      const ratePerSummon = calculateExpectedValue(WISHING_LILY_RATES);
      const bonusPerSummon = GUARANTEED_WISHING_LILIES_PER_SUMMON;
      const regularPullsRatio = 4 / 5;
      const totalPerSummon = ratePerSummon * regularPullsRatio + bonusPerSummon;
      requiredSummons['Wishing Lily'] = Math.ceil(
        targetWishingLilies / totalPerSummon
      );
    }

    if (targetSubstituteDolls && targetSubstituteDolls > 0) {
      const ratePerSummon = calculateExpectedValue(
        SUBSTITUTE_DOLL_FRAGMENT_RATES
      );
      const regularPullsRatio = 4 / 5;
      const totalPerSummon = ratePerSummon * regularPullsRatio;
      requiredSummons['6-Star Substitute Doll Fragment'] = Math.ceil(
        targetSubstituteDolls / totalPerSummon
      );
    }

    if (targetDiamonds && targetDiamonds > 0) {
      const ratePerSummon = calculateExpectedValue(DIAMOND_RATES);
      const regularPullsRatio = 4 / 5;
      const totalPerSummon = ratePerSummon * regularPullsRatio;
      requiredSummons['Diamond'] = Math.ceil(targetDiamonds / totalPerSummon);
    }

    return requiredSummons;
  }, [
    targetShards,
    targetWishingLilies,
    targetSubstituteDolls,
    targetDiamonds,
    currentPulls,
  ]);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Title order={1}>Mythic Summon Calculator</Title>

        <Alert
          variant="light"
          color="blue"
          title="About this calculator"
          icon={<IoInformationCircleOutline />}
        >
          Calculate the average resource yield from Mythic Summons, including
          both drop rates and milestone rewards. Enter the number of summons to
          see expected returns.
        </Alert>

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <Title order={3}>
              <Group gap="xs">
                <IoFlag />
                Target Resources
              </Group>
            </Title>

            <Text size="sm" c="dimmed">
              Enter target amounts to see how many summons you need.
            </Text>

            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
              <NumberInput
                label="Target Mythic Luminary Shards"
                value={targetShards || ''}
                onChange={(val) => setTargetShards(val ? Number(val) : null)}
                min={0}
                max={1000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                label="Target Wishing Lilies"
                value={targetWishingLilies || ''}
                onChange={(val) =>
                  setTargetWishingLilies(val ? Number(val) : null)
                }
                min={0}
                max={100000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                label="Target Substitute Doll Fragments"
                value={targetSubstituteDolls || ''}
                onChange={(val) =>
                  setTargetSubstituteDolls(val ? Number(val) : null)
                }
                min={0}
                max={10000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                label="Target Diamonds"
                value={targetDiamonds || ''}
                onChange={(val) => setTargetDiamonds(val ? Number(val) : null)}
                min={0}
                max={1000000}
                placeholder="Leave empty to skip"
                size="sm"
              />
            </SimpleGrid>

            {Object.entries(reverseResults).length > 0 && (
              <Stack gap="xs">
                {Object.entries(reverseResults).map(([resource, summons]) => (
                  <Alert key={resource} variant="light" color="blue" p="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm">
                        <ResourceBadge name={resource} size="xs" /> need{' '}
                        <strong>{summons}</strong> summons
                      </Text>
                      <Text size="xs" c="dimmed">
                        {currentPulls + summons} total
                      </Text>
                    </Group>
                  </Alert>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <Title order={3}>
              <Group gap="xs">
                <IoSparkles />
                Expected Projection
              </Group>
            </Title>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <NumberInput
                label="Current Pulls"
                description="How many pulls you've already done"
                value={currentPulls}
                onChange={(val) => setCurrentPulls(Number(val) || 0)}
                min={0}
                max={10000}
                placeholder="0"
                size="md"
              />
              <NumberInput
                label="Number of Summons"
                description="How many summons you plan to do"
                value={numSummons}
                onChange={(val) => setNumSummons(Number(val) || 0)}
                min={1}
                max={10000}
                placeholder="100"
                size="md"
                step={10}
                leftSection={<IoSparkles />}
              />
            </SimpleGrid>
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Total pulls: <strong>{results.totalPulls}</strong>
              </Text>
              <Text size="sm" c="dimmed">
                •
              </Text>
              <Text size="sm" c="violet">
                Next guaranteed mythic shard pull in:{' '}
                <strong>{results.nextGuaranteedPull}</strong> summon
                {results.nextGuaranteedPull !== 1 ? 's' : ''}
              </Text>
            </Group>
          </Stack>
        </Card>

        <Title order={3}>Expected Rewards</Title>

        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
          <StatCard
            icon={<IoStar />}
            title="Mythic Luminary Shards"
            value={results.totalMythicShards.toFixed(1)}
            color="violet"
            subtitle={`${results.mythicShards.toFixed(1)} drops + ${results.milestoneShards} milestone`}
            resourceName="Mythic Luminary Shard"
          />
          <StatCard
            icon={<IoSparkles />}
            title="Wishing Lilies"
            value={results.wishingLilies.toFixed(1)}
            color="pink"
            subtitle={`${results.wishingLiliesFromRates.toFixed(1)} drops + ${results.wishingLiliesBonus.toFixed(0)} bonus`}
            resourceName="Wishing Lily"
          />
          <StatCard
            icon={<IoSparkles />}
            title="6-Star Substitute Doll Fragments"
            value={results.substituteDollFragments.toFixed(1)}
            color="cyan"
            resourceName="6-Star Substitute Doll Fragment"
          />
          <StatCard
            icon={<IoDiamond />}
            title="Diamonds"
            value={results.diamonds.toFixed(1)}
            color="yellow"
            resourceName="Diamond"
          />
        </SimpleGrid>

        {nextMilestone && (
          <Alert variant="light" color="violet" icon={<IoStar />}>
            Next milestone: <strong>{nextMilestone.summons} summons</strong> for{' '}
            <strong>{nextMilestone.shards}</strong>{' '}
            <ResourceBadge
              name="Mythic Luminary Shard"
              quantity={nextMilestone.shards}
              size="xs"
            />{' '}
            ({nextMilestone.summons - results.totalPulls} more to go)
          </Alert>
        )}

        <Divider my="md" />

        <Title order={3}>Drop Rates Reference</Title>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Stack gap="xs">
              <Group gap="xs">
                <Text fw={600}>
                  <ResourceBadge name="Mythic Luminary Shard" />
                </Text>
              </Group>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Chance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {MYTHIC_LUMINARY_SHARD_RATES.map((rate, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{rate.amount}</Table.Td>
                      <Table.Td>{(rate.chance * 100).toFixed(1)}%</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Text size="xs" c="dimmed">
                Expected per summon:{' '}
                <strong>
                  {calculateExpectedValue(MYTHIC_LUMINARY_SHARD_RATES).toFixed(
                    2
                  )}
                </strong>
              </Text>
              <Text size="xs" c="dimmed">
                Expected per 5 summons (1 guaranteed):{' '}
                <strong>
                  {(
                    4 * calculateExpectedValue(MYTHIC_LUMINARY_SHARD_RATES) +
                    calculateGuaranteedDropValue(MYTHIC_LUMINARY_SHARD_RATES)
                  ).toFixed(2)}
                </strong>
              </Text>
              <Alert variant="light" color="violet" p="xs" mt="xs">
                <Text size="xs">
                  <strong>Guaranteed:</strong> Every 5th summon guarantees one
                  of these drops (distribution based on rates above)
                </Text>
              </Alert>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="md">
            <Stack gap="xs">
              <Group gap="xs">
                <Text fw={600}>
                  <ResourceBadge name="Wishing Lily" />
                </Text>
              </Group>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Chance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {WISHING_LILY_RATES.map((rate, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{rate.amount}</Table.Td>
                      <Table.Td>{(rate.chance * 100).toFixed(1)}%</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Text size="xs" c="dimmed">
                Expected per summon:{' '}
                <strong>
                  {calculateExpectedValue(WISHING_LILY_RATES).toFixed(2)}
                </strong>
              </Text>
              <Text size="xs" c="dimmed">
                Expected per 5 summons:{' '}
                <strong>
                  {(calculateExpectedValue(WISHING_LILY_RATES) * 4).toFixed(2)}
                </strong>
              </Text>
              <Alert variant="light" color="pink" p="xs" mt="xs">
                <Text size="xs">
                  <strong>Bonus:</strong> Each summon also grants 5-9 Wishing
                  Lilies (avg. {GUARANTEED_WISHING_LILIES_PER_SUMMON})
                </Text>
              </Alert>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="md">
            <Stack gap="xs">
              <Group gap="xs">
                <Text fw={600}>
                  <ResourceBadge name="6-Star Substitute Doll Fragment" />
                </Text>
              </Group>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Chance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {SUBSTITUTE_DOLL_FRAGMENT_RATES.map((rate, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{rate.amount}</Table.Td>
                      <Table.Td>{(rate.chance * 100).toFixed(2)}%</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Text size="xs" c="dimmed">
                Expected per summon:{' '}
                <strong>
                  {calculateExpectedValue(
                    SUBSTITUTE_DOLL_FRAGMENT_RATES
                  ).toFixed(2)}
                </strong>
              </Text>
              <Text size="xs" c="dimmed">
                Expected per 5 summons:{' '}
                <strong>
                  {(
                    calculateExpectedValue(SUBSTITUTE_DOLL_FRAGMENT_RATES) * 4
                  ).toFixed(2)}
                </strong>
              </Text>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="md">
            <Stack gap="xs">
              <Group gap="xs">
                <Text fw={600}>
                  <ResourceBadge name="Diamond" />
                </Text>
              </Group>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Chance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {DIAMOND_RATES.map((rate, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{rate.amount.toLocaleString()}</Table.Td>
                      <Table.Td>{(rate.chance * 100).toFixed(2)}%</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Text size="xs" c="dimmed">
                Expected per summon:{' '}
                <strong>
                  {calculateExpectedValue(DIAMOND_RATES).toFixed(2)}
                </strong>
              </Text>
              <Text size="xs" c="dimmed">
                Expected per 5 summons:{' '}
                <strong>
                  {(calculateExpectedValue(DIAMOND_RATES) * 4).toFixed(2)}
                </strong>
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        <Title order={3}>Milestone Rewards</Title>

        <Card withBorder radius="md" p="md">
          <Stack gap="xs">
            <Text fw={600}>
              Milestone rewards (
              <ResourceBadge name="Mythic Luminary Shard" />)
            </Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Summons</Table.Th>
                  <Table.Th>Reward</Table.Th>
                  <Table.Th>Cumulative</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {MILESTONES.map((milestone, idx) => {
                  const cumulative = MILESTONES.slice(0, idx + 1).reduce(
                    (sum, m) => sum + m.shards,
                    0
                  );
                  const isReached = numSummons >= milestone.summons;
                  return (
                    <Table.Tr
                      key={idx}
                      style={{
                        opacity: isReached ? 1 : 0.5,
                        fontWeight: isReached ? 600 : 400,
                      }}
                    >
                      <Table.Td>{milestone.summons}</Table.Td>
                      <Table.Td>{milestone.shards} shards</Table.Td>
                      <Table.Td>{cumulative} total</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
