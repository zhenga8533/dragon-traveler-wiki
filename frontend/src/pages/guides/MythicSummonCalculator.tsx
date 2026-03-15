import GuideHeroCard from './components/GuideHeroCard';
import StatCard from '@/components/ui/StatCard';
import {
  getCardHoverProps,
} from '@/constants/styles';
import ResourceBadge from '@/features/characters/components/ResourceBadge';
import { useGradientAccent } from '@/hooks';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import {
  IoDiamond,
  IoFlag,
  IoInformationCircleOutline,
  IoSparkles,
  IoStar,
} from 'react-icons/io5';

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

function calculateGuaranteedPulls(
  currentPulls: number,
  summons: number
): number {
  if (summons < 1) {
    return 0;
  }

  const firstGuaranteedPull = 5 - (currentPulls % 5);

  if (summons < firstGuaranteedPull) {
    return 0;
  }

  return 1 + Math.floor((summons - firstGuaranteedPull) / 5);
}

function calculateRegularPulls(currentPulls: number, summons: number): number {
  const guaranteedPulls = calculateGuaranteedPulls(currentPulls, summons);
  return summons - guaranteedPulls;
}

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

// Conditional pity: 5th pull is only guaranteed if none of the first 4 dropped a shard.
// P(pity fires) = (1 - p)^4 where p = total drop rate across all tiers.
// E[5th pull] = P(pity) × E[guaranteed] + (1 - P(pity)) × E[regular]
function calculateConditionalGuaranteedValue(rates: DropRate[]): number {
  const p = rates.reduce((sum, rate) => sum + rate.chance, 0);
  const pityProb = Math.pow(1 - p, 4);
  return pityProb * calculateGuaranteedDropValue(rates) + (1 - pityProb) * calculateExpectedValue(rates);
}

function calculateMilestoneRewards(summons: number): number {
  return MILESTONES.filter((m) => m.summons <= summons).reduce(
    (sum, m) => sum + m.shards,
    0
  );
}

// Roll once against a drop table. If guaranteed=true, normalize rates to 100% so
// a result is always returned; otherwise return 0 if the roll misses all entries.
function rollDropTable(rates: DropRate[], guaranteed: boolean): number {
  const roll = Math.random();
  let cumulative = 0;

  if (guaranteed) {
    const total = rates.reduce((sum, r) => sum + r.chance, 0);
    for (const rate of rates) {
      cumulative += rate.chance / total;
      if (roll < cumulative) return rate.amount;
    }
    return rates[rates.length - 1].amount;
  }

  for (const rate of rates) {
    cumulative += rate.chance;
    if (roll < cumulative) return rate.amount;
  }
  return 0;
}

type SimResult = {
  shardsFromDrops: number;
  wishingLilies: number;
  substituteDolls: number;
  diamonds: number;
  milestoneShards: number;
  totalShards: number;
};

function simulateOnce(
  currentPulls: number,
  numSummons: number,
  conditionalPity: boolean
): SimResult {
  let shardsFromDrops = 0;
  let wishingLilies = 0;
  let substituteDolls = 0;
  let diamonds = 0;

  // posInGroup tracks where we are within the current group of 5 (0-indexed).
  // Position 4 is the guaranteed pull.
  let posInGroup = currentPulls % 5;
  let groupHadShard = false;

  for (let i = 0; i < numSummons; i++) {
    const isGuaranteedPull = posInGroup === 4;

    // The 5th pull "uses up" the slot for other resources only when pity fires.
    // In conditional pity mode pity only fires if no shard dropped in pulls 1-4.
    const pityFires = isGuaranteedPull && (!conditionalPity || !groupHadShard);

    if (isGuaranteedPull) {
      shardsFromDrops += rollDropTable(MYTHIC_LUMINARY_SHARD_RATES, pityFires);
      groupHadShard = false;
    } else {
      const shardAmount = rollDropTable(MYTHIC_LUMINARY_SHARD_RATES, false);
      if (shardAmount > 0) groupHadShard = true;
      shardsFromDrops += shardAmount;
    }

    // Other drops only roll on pulls that aren't locked by a pity guarantee
    if (!pityFires) {
      wishingLilies += rollDropTable(WISHING_LILY_RATES, false);
      substituteDolls += rollDropTable(SUBSTITUTE_DOLL_FRAGMENT_RATES, false);
      diamonds += rollDropTable(DIAMOND_RATES, false);
    }
    wishingLilies += Math.floor(Math.random() * 5) + 5; // 5-9 bonus lilies every summon

    posInGroup = (posInGroup + 1) % 5;
  }

  const milestoneShards =
    calculateMilestoneRewards(currentPulls + numSummons) -
    calculateMilestoneRewards(currentPulls);

  return {
    shardsFromDrops,
    wishingLilies,
    substituteDolls,
    diamonds,
    milestoneShards,
    totalShards: shardsFromDrops + milestoneShards,
  };
}

export default function MythicSummonCalculator() {
  const { accent } = useGradientAccent();
  const [numSummons, setNumSummons] = useState<number | null>(100);
  const [currentPulls, setCurrentPulls] = useState<number | null>(0);
  const [conditionalPity, setConditionalPity] = useState(true);
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const handleSimulate = useCallback(() => {
    setSimResult(
      simulateOnce(currentPulls ?? 0, numSummons ?? 0, conditionalPity)
    );
  }, [currentPulls, numSummons, conditionalPity]);

  const [targetShards, setTargetShards] = useState<number | null>(null);
  const [targetWishingLilies, setTargetWishingLilies] = useState<number | null>(
    null
  );
  const [targetSubstituteDolls, setTargetSubstituteDolls] = useState<
    number | null
  >(null);
  const [targetDiamonds, setTargetDiamonds] = useState<number | null>(null);

  const results = useMemo(() => {
    const safeCurrentPulls = currentPulls ?? 0;
    const safeNumSummons = numSummons ?? 0;

    if (safeNumSummons < 1) {
      return {
        mythicShards: 0,
        wishingLilies: 0,
        wishingLiliesFromRates: 0,
        wishingLiliesBonus: 0,
        substituteDollFragments: 0,
        diamonds: 0,
        milestoneShards: 0,
        totalMythicShards: 0,
        totalPulls: safeCurrentPulls,
        nextGuaranteedPull: 0,
      };
    }

    const totalPulls = safeCurrentPulls + safeNumSummons;
    const nextGuaranteedPull = 5 - (totalPulls % 5 || 5);

    // Calculate mythic shards with 5th pull mechanic.
    // In conditional pity mode, the guarantee only fires if the first 4 pulls
    // in that group of 5 all missed (P(pity) = (1-0.40)^4 ≈ 12.96%).
    const guaranteedMythicShardsValue = conditionalPity
      ? calculateConditionalGuaranteedValue(MYTHIC_LUMINARY_SHARD_RATES)
      : calculateGuaranteedDropValue(MYTHIC_LUMINARY_SHARD_RATES);

    // Count how many guaranteed pulls we get
    const guaranteedPulls = calculateGuaranteedPulls(
      safeCurrentPulls,
      safeNumSummons
    );
    const regularPulls = calculateRegularPulls(
      safeCurrentPulls,
      safeNumSummons
    );

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

    // In conditional pity mode the 5th pull only "locks out" other resources
    // when pity fires (prob = (1-0.40)^4 ≈ 12.96%). The rest of the time it
    // acts like a regular pull and can drop everything normally.
    const pityTriggerProb = conditionalPity
      ? Math.pow(1 - MYTHIC_LUMINARY_SHARD_RATES.reduce((s, r) => s + r.chance, 0), 4)
      : 1;
    const effectiveRegularPulls = regularPulls + guaranteedPulls * (1 - pityTriggerProb);

    const wishingLiliesFromRates = wishingLiliesPerSummon * effectiveRegularPulls;
    const wishingLiliesBonus =
      GUARANTEED_WISHING_LILIES_PER_SUMMON * safeNumSummons;
    const totalWishingLilies = wishingLiliesFromRates + wishingLiliesBonus;

    return {
      mythicShards,
      wishingLilies: totalWishingLilies,
      wishingLiliesFromRates,
      wishingLiliesBonus,
      substituteDollFragments: substituteDollFragmentsPerSummon * effectiveRegularPulls,
      diamonds: diamondsPerSummon * effectiveRegularPulls,
      milestoneShards,
      totalMythicShards,
      totalPulls,
      nextGuaranteedPull,
    };
  }, [numSummons, currentPulls, conditionalPity]);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find((m) => m.summons > results.totalPulls);
  }, [results.totalPulls]);

  // Reverse calculator
  const reverseResults = useMemo(() => {
    const requiredSummons: Record<string, number> = {};
    const safeCurrentPulls = currentPulls ?? 0;

    const mythicShardPerRegular = calculateExpectedValue(
      MYTHIC_LUMINARY_SHARD_RATES
    );
    const mythicShardPerGuaranteed = conditionalPity
      ? calculateConditionalGuaranteedValue(MYTHIC_LUMINARY_SHARD_RATES)
      : calculateGuaranteedDropValue(MYTHIC_LUMINARY_SHARD_RATES);
    const wishingLilyPerRegular = calculateExpectedValue(WISHING_LILY_RATES);
    const substituteDollsPerRegular = calculateExpectedValue(
      SUBSTITUTE_DOLL_FRAGMENT_RATES
    );
    const diamondsPerRegular = calculateExpectedValue(DIAMOND_RATES);

    const pityTriggerProb = conditionalPity
      ? Math.pow(1 - MYTHIC_LUMINARY_SHARD_RATES.reduce((s, r) => s + r.chance, 0), 4)
      : 1;

    const getExpectedBySummons = (summons: number) => {
      const regularPulls = calculateRegularPulls(safeCurrentPulls, summons);
      const guaranteedPulls = summons - regularPulls;
      const effectiveRegularPulls = regularPulls + guaranteedPulls * (1 - pityTriggerProb);
      const milestoneBonus =
        calculateMilestoneRewards(safeCurrentPulls + summons) -
        calculateMilestoneRewards(safeCurrentPulls);

      return {
        mythicShards:
          mythicShardPerRegular * regularPulls +
          mythicShardPerGuaranteed * guaranteedPulls +
          milestoneBonus,
        wishingLilies:
          wishingLilyPerRegular * effectiveRegularPulls +
          GUARANTEED_WISHING_LILIES_PER_SUMMON * summons,
        substituteDolls: substituteDollsPerRegular * effectiveRegularPulls,
        diamonds: diamondsPerRegular * effectiveRegularPulls,
      };
    };

    const findSummonsForTarget = (
      getValue: (summons: number) => number,
      target: number
    ) => {
      let low = 1;
      let high = 1;

      while (getValue(high) < target && high < 1000000) {
        high *= 2;
      }

      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (getValue(mid) >= target) {
          high = mid;
        } else {
          low = mid + 1;
        }
      }

      return low;
    };

    if (targetShards && targetShards > 0) {
      requiredSummons['Mythic Luminary Shard'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).mythicShards,
        targetShards
      );
    }

    if (targetWishingLilies && targetWishingLilies > 0) {
      requiredSummons['Wishing Lily'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).wishingLilies,
        targetWishingLilies
      );
    }

    if (targetSubstituteDolls && targetSubstituteDolls > 0) {
      requiredSummons['6-Star Substitute Doll Fragment'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).substituteDolls,
        targetSubstituteDolls
      );
    }

    if (targetDiamonds && targetDiamonds > 0) {
      requiredSummons['Diamond'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).diamonds,
        targetDiamonds
      );
    }

    return requiredSummons;
  }, [
    targetShards,
    targetWishingLilies,
    targetSubstituteDolls,
    targetDiamonds,
    currentPulls,
    conditionalPity,
  ]);


  return (
    <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <GuideHeroCard
          icon={<IoSparkles size={20} />}
          title="Mythic Summon Calculator"
          subtitle="Forecast summon outcomes and reverse-calculate required pulls for your goals."
        >
          <Alert
            variant="light"
            color={accent.primary}
            title="About this calculator"
            icon={<IoInformationCircleOutline />}
          >
            Calculate the average resource yield from Mythic Summons, including
            both drop rates and milestone rewards. Enter the number of summons
            to see expected returns.
          </Alert>
        </GuideHeroCard>

        <Card
          withBorder
          radius="md"
          p="lg"
          {...getCardHoverProps()}
        >
          <Stack gap="md">
            <Title order={2} size="h3">
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
                value={targetShards ?? ''}
                onChange={(val) => setTargetShards(parseNumberInput(val))}
                min={0}
                max={1000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                label="Target Wishing Lilies"
                value={targetWishingLilies ?? ''}
                onChange={(val) =>
                  setTargetWishingLilies(parseNumberInput(val))
                }
                min={0}
                max={100000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                label="Target Substitute Doll Fragments"
                value={targetSubstituteDolls ?? ''}
                onChange={(val) =>
                  setTargetSubstituteDolls(parseNumberInput(val))
                }
                min={0}
                max={10000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                label="Target Diamonds"
                value={targetDiamonds ?? ''}
                onChange={(val) => setTargetDiamonds(parseNumberInput(val))}
                min={0}
                max={1000000}
                placeholder="Leave empty to skip"
                size="sm"
              />
            </SimpleGrid>

            {Object.entries(reverseResults).length > 0 && (
              <Stack gap="xs">
                {Object.entries(reverseResults).map(([resource, summons]) => (
                  <Alert key={resource} variant="light" color={accent.primary} p="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm">
                        <ResourceBadge name={resource} size="xs" /> need{' '}
                        <strong>{summons}</strong> summons
                      </Text>
                      <Text size="xs" c="dimmed">
                        {(currentPulls ?? 0) + summons} total
                      </Text>
                    </Group>
                  </Alert>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        <Card
          withBorder
          radius="md"
          p="lg"
          {...getCardHoverProps()}
        >
          <Stack gap="md">
            <Title order={2} size="h3">
              <Group gap="xs">
                <IoSparkles />
                Expected Projection
              </Group>
            </Title>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <NumberInput
                label="Current Pulls"
                description="How many pulls you've already done"
                value={currentPulls ?? ''}
                onChange={(val) => setCurrentPulls(parseNumberInput(val))}
                min={0}
                max={10000}
                placeholder="0"
                size="md"
              />
              <NumberInput
                label="Number of Summons"
                description="How many summons you plan to do"
                value={numSummons ?? ''}
                onChange={(val) => setNumSummons(parseNumberInput(val))}
                min={1}
                max={10000}
                placeholder="100"
                size="md"
                step={10}
                leftSection={<IoSparkles />}
              />
            </SimpleGrid>
            <Switch
              checked={conditionalPity}
              onChange={(e) => setConditionalPity(e.currentTarget.checked)}
              color={accent.primary}
              label="Conditional pity"
              description={
                conditionalPity
                  ? "5th pull only guarantees a shard if the first 4 all missed (P ≈ 12.96%)"
                  : "5th pull always guarantees a shard regardless of earlier pulls"
              }
              size="sm"
            />
            <Group gap="xs" justify="space-between" wrap="wrap">
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  Total pulls: <strong>{results.totalPulls}</strong>
                </Text>
                <Text size="sm" c="dimmed">•</Text>
                <Text size="sm" c={`${accent.primary}.7`}>
                  Next guaranteed mythic shard pull in:{' '}
                  <strong>{results.nextGuaranteedPull}</strong> summon
                  {results.nextGuaranteedPull !== 1 ? 's' : ''}
                </Text>
              </Group>
              <Button
                variant="light"
                color={accent.primary}
                size="sm"
                onClick={handleSimulate}
                disabled={(numSummons ?? 0) < 1}
              >
                {simResult ? 'Re-simulate' : 'Simulate'}
              </Button>
            </Group>
          </Stack>
        </Card>

        <Card
          withBorder
          radius="md"
          p="lg"
          {...getCardHoverProps()}
        >
          <Stack gap="md">
            <Title order={2} size="h3">
              Expected Rewards
            </Title>
            <Text size="sm" c="dimmed">
              Average rewards from your selected summons.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="lg">
              <StatCard
                icon={<IoStar />}
                title="Mythic Luminary Shards"
                value={results.totalMythicShards.toFixed(1)}
                color={accent.primary}
                subtitle={`${results.mythicShards.toFixed(1)} drops + ${results.milestoneShards} milestone`}
                resourceName="Mythic Luminary Shard"
                showIcon={false}
                showTitle={false}
                showResourceQuantity={false}
              />
              <StatCard
                icon={<IoSparkles />}
                title="Wishing Lilies"
                value={results.wishingLilies.toFixed(1)}
                color="pink"
                subtitle={`${results.wishingLiliesFromRates.toFixed(1)} drops + ${results.wishingLiliesBonus.toFixed(0)} bonus`}
                resourceName="Wishing Lily"
                showIcon={false}
                showTitle={false}
                showResourceQuantity={false}
              />
              <StatCard
                icon={<IoSparkles />}
                title="6-Star Substitute Doll Fragments"
                value={results.substituteDollFragments.toFixed(1)}
                color="cyan"
                subtitle="From regular-pull drop rates"
                resourceName="6-Star Substitute Doll Fragment"
                showIcon={false}
                showTitle={false}
                showResourceQuantity={false}
              />
              <StatCard
                icon={<IoDiamond />}
                title="Diamonds"
                value={results.diamonds.toFixed(1)}
                color="yellow"
                subtitle="From regular-pull drop rates"
                resourceName="Diamond"
                showIcon={false}
                showTitle={false}
                showResourceQuantity={false}
              />
            </SimpleGrid>

            {simResult && (
              <>
                <Divider label="Simulation result (1 run)" labelPosition="center" />
                <Table withRowBorders={false} fz="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Resource</Table.Th>
                      <Table.Th ta="right">Expected</Table.Th>
                      <Table.Th ta="right">Simulated</Table.Th>
                      <Table.Th ta="right">Diff</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {[
                      {
                        name: 'Mythic Luminary Shard',
                        expected: results.totalMythicShards,
                        simulated: simResult.totalShards,
                      },
                      {
                        name: 'Wishing Lily',
                        expected: results.wishingLilies,
                        simulated: simResult.wishingLilies,
                      },
                      {
                        name: '6-Star Substitute Doll Fragment',
                        expected: results.substituteDollFragments,
                        simulated: simResult.substituteDolls,
                      },
                      {
                        name: 'Diamond',
                        expected: results.diamonds,
                        simulated: simResult.diamonds,
                      },
                    ].map(({ name, expected, simulated }) => {
                      const diff = simulated - expected;
                      return (
                        <Table.Tr key={name}>
                          <Table.Td>
                            <ResourceBadge name={name} size="xs" />
                          </Table.Td>
                          <Table.Td ta="right" c="dimmed">
                            {expected.toFixed(1)}
                          </Table.Td>
                          <Table.Td ta="right">
                            <strong>{simulated}</strong>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Badge
                              size="sm"
                              variant="light"
                              color={diff >= 0 ? 'green' : 'red'}
                            >
                              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </>
            )}
          </Stack>
        </Card>

        {nextMilestone && (
          <Alert variant="light" color={accent.primary} icon={<IoStar />}>
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

        <Title order={2} size="h3">
          Drop Rates Reference
        </Title>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Card
            withBorder
            radius="md"
            p="md"
            {...getCardHoverProps()}
          >
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
                    (conditionalPity
                      ? calculateConditionalGuaranteedValue(MYTHIC_LUMINARY_SHARD_RATES)
                      : calculateGuaranteedDropValue(MYTHIC_LUMINARY_SHARD_RATES))
                  ).toFixed(2)}
                </strong>
              </Text>
              <Alert variant="light" color={accent.primary} p="xs" mt="xs">
                <Text size="xs">
                  {conditionalPity ? (
                    <>
                      <strong>Conditional pity:</strong> The 5th summon only
                      guarantees a shard if none of the first 4 dropped one
                      (P ≈ 12.96%). Otherwise it rolls at normal rates.
                    </>
                  ) : (
                    <>
                      <strong>Guaranteed:</strong> Every 5th summon guarantees
                      one of these drops (distribution based on rates above)
                    </>
                  )}
                </Text>
              </Alert>
            </Stack>
          </Card>

          <Card
            withBorder
            radius="md"
            p="md"
            {...getCardHoverProps()}
          >
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

          <Card
            withBorder
            radius="md"
            p="md"
            {...getCardHoverProps()}
          >
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

          <Card
            withBorder
            radius="md"
            p="md"
            {...getCardHoverProps()}
          >
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

        <Title order={2} size="h3">
          Milestone Rewards
        </Title>

        <Card
          withBorder
          radius="md"
          p="md"
          {...getCardHoverProps()}
        >
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
                  const isReached = results.totalPulls >= milestone.summons;
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
