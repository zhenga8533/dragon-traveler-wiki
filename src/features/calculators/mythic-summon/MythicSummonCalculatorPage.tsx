import GuideHeroCard from '@/features/guides/components/GuideHeroCard';
import MythicSummonReference from '@/features/calculators/mythic-summon/components/MythicSummonReference';
import {
  calculateConditionalGuaranteedValue,
  calculateExpectedValue,
  calculateGuaranteedDropValue,
  type DropRate,
} from '@/features/calculators/mythic-summon/drop-rates';
import StatCard from '@/components/ui/StatCard';
import { StaticSurface } from '@/components/ui/Surface';
import { parseNumberInput } from '@/utils';
import ResourceBadge from '@/components/ui/ResourceBadge';
import { useGradientAccent } from '@/hooks';
import {
  Alert,
  Badge,
  Button,
  Container,
  Divider,
  Group,
  NumberInput,
  ScrollArea,
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

function calculateGuaranteedPulls(
  currentPulls: number,
  summons: number,
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

function calculateMilestoneRewards(summons: number): number {
  return MILESTONES.filter((m) => m.summons <= summons).reduce(
    (sum, m) => sum + m.shards,
    0,
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
  conditionalPity: boolean,
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

export default function MythicSummonCalculatorPage() {
  const { accent } = useGradientAccent();
  const [numSummons, setNumSummons] = useState<number | null>(100);
  const [currentPulls, setCurrentPulls] = useState<number | null>(0);
  const [conditionalPity, setConditionalPity] = useState(false);
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const handleSimulate = useCallback(() => {
    setSimResult(
      simulateOnce(currentPulls ?? 0, numSummons ?? 0, conditionalPity),
    );
  }, [currentPulls, numSummons, conditionalPity]);

  const [targetShards, setTargetShards] = useState<number | null>(null);
  const [targetWishingLilies, setTargetWishingLilies] = useState<number | null>(
    null,
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
      safeNumSummons,
    );
    const regularPulls = calculateRegularPulls(
      safeCurrentPulls,
      safeNumSummons,
    );

    // Regular pulls have the normal drop rate
    const mythicShardsPerRegularSummon = calculateExpectedValue(
      MYTHIC_LUMINARY_SHARD_RATES,
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
      SUBSTITUTE_DOLL_FRAGMENT_RATES,
    );
    const diamondsPerSummon = calculateExpectedValue(DIAMOND_RATES);

    // In conditional pity mode the 5th pull only "locks out" other resources
    // when pity fires (prob = (1-0.40)^4 ≈ 12.96%). The rest of the time it
    // acts like a regular pull and can drop everything normally.
    const pityTriggerProb = conditionalPity
      ? Math.pow(
          1 - MYTHIC_LUMINARY_SHARD_RATES.reduce((s, r) => s + r.chance, 0),
          4,
        )
      : 1;
    const effectiveRegularPulls =
      regularPulls + guaranteedPulls * (1 - pityTriggerProb);

    const wishingLiliesFromRates =
      wishingLiliesPerSummon * effectiveRegularPulls;
    const wishingLiliesBonus =
      GUARANTEED_WISHING_LILIES_PER_SUMMON * safeNumSummons;
    const totalWishingLilies = wishingLiliesFromRates + wishingLiliesBonus;

    return {
      mythicShards,
      wishingLilies: totalWishingLilies,
      wishingLiliesFromRates,
      wishingLiliesBonus,
      substituteDollFragments:
        substituteDollFragmentsPerSummon * effectiveRegularPulls,
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
      MYTHIC_LUMINARY_SHARD_RATES,
    );
    const mythicShardPerGuaranteed = conditionalPity
      ? calculateConditionalGuaranteedValue(MYTHIC_LUMINARY_SHARD_RATES)
      : calculateGuaranteedDropValue(MYTHIC_LUMINARY_SHARD_RATES);
    const wishingLilyPerRegular = calculateExpectedValue(WISHING_LILY_RATES);
    const substituteDollsPerRegular = calculateExpectedValue(
      SUBSTITUTE_DOLL_FRAGMENT_RATES,
    );
    const diamondsPerRegular = calculateExpectedValue(DIAMOND_RATES);

    const pityTriggerProb = conditionalPity
      ? Math.pow(
          1 - MYTHIC_LUMINARY_SHARD_RATES.reduce((s, r) => s + r.chance, 0),
          4,
        )
      : 1;

    const getExpectedBySummons = (summons: number) => {
      const regularPulls = calculateRegularPulls(safeCurrentPulls, summons);
      const guaranteedPulls = summons - regularPulls;
      const effectiveRegularPulls =
        regularPulls + guaranteedPulls * (1 - pityTriggerProb);
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
      target: number,
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
      requiredSummons['mythic_luminary_shard'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).mythicShards,
        targetShards,
      );
    }

    if (targetWishingLilies && targetWishingLilies > 0) {
      requiredSummons['wishing_lily'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).wishingLilies,
        targetWishingLilies,
      );
    }

    if (targetSubstituteDolls && targetSubstituteDolls > 0) {
      requiredSummons['6_star_substitute_doll_fragment'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).substituteDolls,
        targetSubstituteDolls,
      );
    }

    if (targetDiamonds && targetDiamonds > 0) {
      requiredSummons['diamond'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).diamonds,
        targetDiamonds,
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

        <StaticSurface p="lg">
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
                {Object.entries(reverseResults).map(
                  ([resourceSlug, summons]) => (
                    <Alert
                      key={resourceSlug}
                      variant="light"
                      color={accent.primary}
                      p="sm"
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm">
                          <ResourceBadge slug={resourceSlug} size="xs" /> need{' '}
                          <strong>{summons}</strong> summons
                        </Text>
                        <Text size="xs" c="dimmed">
                          {(currentPulls ?? 0) + summons} total
                        </Text>
                      </Group>
                    </Alert>
                  ),
                )}
              </Stack>
            )}
          </Stack>
        </StaticSurface>

        <StaticSurface p="lg">
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
                  ? '5th pull only guarantees a shard if the first 4 all missed (P ≈ 12.96%)'
                  : '5th pull always guarantees a shard regardless of earlier pulls'
              }
              size="sm"
            />
            <Group gap="xs" wrap="wrap">
              <Text size="sm" c="dimmed">
                Total pulls: <strong>{results.totalPulls}</strong>
              </Text>
              <Text size="sm" c="dimmed">
                •
              </Text>
              <Text size="sm" className="dt-link-text">
                Next guaranteed mythic shard pull in:{' '}
                <strong>{results.nextGuaranteedPull}</strong> summon
                {results.nextGuaranteedPull !== 1 ? 's' : ''}
              </Text>
            </Group>
          </Stack>
        </StaticSurface>

        <StaticSurface p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap={4}>
                <Title order={2} size="h3">
                  Expected Rewards
                </Title>
                <Text size="sm" c="dimmed">
                  Average rewards from your selected summons.
                </Text>
              </Stack>
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

            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="lg">
              <StatCard
                icon={<IoStar />}
                title="Mythic Luminary Shards"
                value={results.totalMythicShards.toFixed(1)}
                color={accent.primary}
                subtitle={`${results.mythicShards.toFixed(1)} drops + ${results.milestoneShards} milestone`}
                resourceSlug="mythic_luminary_shard"
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
                resourceSlug="wishing_lily"
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
                resourceSlug="6_star_substitute_doll_fragment"
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
                resourceSlug="diamond"
                showIcon={false}
                showTitle={false}
                showResourceQuantity={false}
              />
            </SimpleGrid>

            {simResult && (
              <>
                <Divider
                  label="Simulation result (1 run)"
                  labelPosition="center"
                />
                <ScrollArea>
                  <Table withRowBorders={false} fz="sm" miw={380}>
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
                          slug: 'mythic_luminary_shard',
                          expected: results.totalMythicShards,
                          simulated: simResult.totalShards,
                        },
                        {
                          slug: 'wishing_lily',
                          expected: results.wishingLilies,
                          simulated: simResult.wishingLilies,
                        },
                        {
                          slug: '6_star_substitute_doll_fragment',
                          expected: results.substituteDollFragments,
                          simulated: simResult.substituteDolls,
                        },
                        {
                          slug: 'diamond',
                          expected: results.diamonds,
                          simulated: simResult.diamonds,
                        },
                      ].map(({ slug, expected, simulated }) => {
                        const diff = simulated - expected;
                        return (
                          <Table.Tr key={slug}>
                            <Table.Td>
                              <ResourceBadge slug={slug} size="xs" />
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
                                {diff >= 0 ? '+' : ''}
                                {diff.toFixed(1)}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </Stack>
        </StaticSurface>

        {nextMilestone && (
          <Alert variant="light" color={accent.primary} icon={<IoStar />}>
            Next milestone: <strong>{nextMilestone.summons} summons</strong> for{' '}
            <strong>{nextMilestone.shards}</strong>{' '}
            <ResourceBadge
              slug="mythic_luminary_shard"
              quantity={nextMilestone.shards}
              size="xs"
            />{' '}
            ({nextMilestone.summons - results.totalPulls} more to go)
          </Alert>
        )}

        <Divider my="md" />

        <MythicSummonReference
          shardRates={MYTHIC_LUMINARY_SHARD_RATES}
          wishingLilyRates={WISHING_LILY_RATES}
          substituteDollRates={SUBSTITUTE_DOLL_FRAGMENT_RATES}
          diamondRates={DIAMOND_RATES}
          guaranteedWishingLilies={GUARANTEED_WISHING_LILIES_PER_SUMMON}
          milestones={MILESTONES}
          totalPulls={results.totalPulls}
          conditionalPity={conditionalPity}
          accentColor={accent.primary}
        />
      </Stack>
    </Container>
  );
}
