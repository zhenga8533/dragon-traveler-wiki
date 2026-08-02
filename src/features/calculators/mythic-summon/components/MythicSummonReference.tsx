import {
  Alert,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import ResourceBadge from '@/components/ui/ResourceBadge';
import { StaticSurface } from '@/components/ui/Surface';
import {
  calculateConditionalGuaranteedValue,
  calculateExpectedValue,
  calculateGuaranteedDropValue,
  type DropRate,
} from '@/features/calculators/mythic-summon/drop-rates';

interface Milestone {
  summons: number;
  shards: number;
}

interface DropRateCardProps {
  resourceSlug: string;
  rates: DropRate[];
  chanceDigits?: number;
  amountLocale?: boolean;
  expectedPulls: number;
  note?: React.ReactNode;
  noteColor?: string;
}

function DropRateCard({
  resourceSlug,
  rates,
  chanceDigits = 2,
  amountLocale = false,
  expectedPulls,
  note,
  noteColor,
}: DropRateCardProps) {
  return (
    <StaticSurface p="md">
      <Stack gap="xs">
        <Text fw={600}>
          <ResourceBadge slug={resourceSlug} />
        </Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Chance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rates.map((rate) => (
              <Table.Tr key={`${rate.amount}:${rate.chance}`}>
                <Table.Td>
                  {amountLocale ? rate.amount.toLocaleString() : rate.amount}
                </Table.Td>
                <Table.Td>
                  {(rate.chance * 100).toFixed(chanceDigits)}%
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Text size="xs" c="dimmed">
          Expected per summon:{' '}
          <strong>{calculateExpectedValue(rates).toFixed(2)}</strong>
        </Text>
        <Text size="xs" c="dimmed">
          Expected per 5 summons: <strong>{expectedPulls.toFixed(2)}</strong>
        </Text>
        {note ? (
          <Alert variant="light" color={noteColor} p="xs" mt="xs">
            <Text size="xs">{note}</Text>
          </Alert>
        ) : null}
      </Stack>
    </StaticSurface>
  );
}

export default function MythicSummonReference({
  shardRates,
  wishingLilyRates,
  substituteDollRates,
  diamondRates,
  guaranteedWishingLilies,
  milestones,
  totalPulls,
  conditionalPity,
  accentColor,
}: {
  shardRates: DropRate[];
  wishingLilyRates: DropRate[];
  substituteDollRates: DropRate[];
  diamondRates: DropRate[];
  guaranteedWishingLilies: number;
  milestones: Milestone[];
  totalPulls: number;
  conditionalPity: boolean;
  accentColor: string;
}) {
  const shardExpectedPerFive =
    4 * calculateExpectedValue(shardRates) +
    (conditionalPity
      ? calculateConditionalGuaranteedValue(shardRates)
      : calculateGuaranteedDropValue(shardRates));

  return (
    <>
      <Title order={2} size="h3">
        Drop Rates Reference
      </Title>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <DropRateCard
          resourceSlug="mythic_luminary_shard"
          rates={shardRates}
          chanceDigits={1}
          expectedPulls={shardExpectedPerFive}
          noteColor={accentColor}
          note={
            conditionalPity ? (
              <>
                <strong>Conditional pity:</strong> The 5th summon only
                guarantees a shard if none of the first 4 dropped one (P ≈
                12.96%). Otherwise it rolls at normal rates.
              </>
            ) : (
              <>
                <strong>Guaranteed:</strong> Every 5th summon guarantees one of
                these drops (distribution based on rates above)
              </>
            )
          }
        />
        <DropRateCard
          resourceSlug="wishing_lily"
          rates={wishingLilyRates}
          chanceDigits={1}
          expectedPulls={calculateExpectedValue(wishingLilyRates) * 4}
          noteColor="pink"
          note={
            <>
              <strong>Bonus:</strong> Each summon also grants 5-9 Wishing
              Lilies (avg. {guaranteedWishingLilies})
            </>
          }
        />
        <DropRateCard
          resourceSlug="6_star_substitute_doll_fragment"
          rates={substituteDollRates}
          expectedPulls={calculateExpectedValue(substituteDollRates) * 4}
        />
        <DropRateCard
          resourceSlug="diamond"
          rates={diamondRates}
          amountLocale
          expectedPulls={calculateExpectedValue(diamondRates) * 4}
        />
      </SimpleGrid>
      <Title order={2} size="h3">
        Milestone Rewards
      </Title>
      <StaticSurface p="md">
        <Stack gap="xs">
          <Text fw={600}>
            Milestone rewards (
            <ResourceBadge slug="mythic_luminary_shard" />)
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
              {milestones.map((milestone, index) => {
                const cumulative = milestones
                  .slice(0, index + 1)
                  .reduce((sum, entry) => sum + entry.shards, 0);
                const reached = totalPulls >= milestone.summons;
                return (
                  <Table.Tr
                    key={milestone.summons}
                    style={{
                      opacity: reached ? 1 : 0.5,
                      fontWeight: reached ? 600 : 400,
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
      </StaticSurface>
    </>
  );
}
