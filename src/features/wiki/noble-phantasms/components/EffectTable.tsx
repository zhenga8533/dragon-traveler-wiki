import RichText from '@/components/common/RichText';
import { COMPACT_COL_STYLE } from '@/constants/styles';
import type { Skill, Talent } from '@/features/characters/types';
import type { NoblePhantasmEffect } from '@/features/wiki/noble-phantasms/types';
import {
  getNoblePhantasmTierDetail,
  getNoblePhantasmTierOrder,
} from '@/features/wiki/noble-phantasms/utils';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { Badge, Box, Table, Text } from '@mantine/core';

export default function EffectTable({
  effects,
  statusEffects,
  skills,
  talent,
}: {
  effects: NoblePhantasmEffect[];
  statusEffects: StatusEffect[];
  skills?: Skill[];
  talent?: Talent | null;
}) {
  const sortedEffects = [...effects].sort(
    (a, b) =>
      getNoblePhantasmTierOrder(a.tier) - getNoblePhantasmTierOrder(b.tier)
  );

  if (sortedEffects.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No effect breakpoints recorded.
      </Text>
    );
  }

  return (
    <Box style={{ overflowX: 'auto' }}>
    <Table striped withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={COMPACT_COL_STYLE}>Tier</Table.Th>
          <Table.Th style={COMPACT_COL_STYLE}>Unlock</Table.Th>
          <Table.Th>Description</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sortedEffects.map((effect, idx) => {
          const tierDetail = getNoblePhantasmTierDetail(effect.tier);
          return (
            <Table.Tr
              key={`${effect.tier ?? 'none'}-${effect.tier_level ?? 'none'}-${idx}`}
            >
              <Table.Td style={COMPACT_COL_STYLE}>
                {effect.tier ? (
                  <Badge
                    size="sm"
                    variant="light"
                    color={tierDetail?.color ?? 'gray'}
                  >
                    {effect.tier}
                  </Badge>
                ) : (
                  <Text size="sm" c="dimmed">
                    —
                  </Text>
                )}
              </Table.Td>
              <Table.Td style={COMPACT_COL_STYLE}>
                <Text
                  size="sm"
                  fw={tierDetail ? 600 : 400}
                  c={tierDetail || effect.tier_level != null ? undefined : 'dimmed'}
                >
                  {tierDetail?.label ?? effect.tier_level ?? '—'}
                </Text>
              </Table.Td>
              <Table.Td>
                <RichText
                  text={effect.description}
                  statusEffects={statusEffects}
                  skills={skills}
                  talent={talent}
                />
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
    </Box>
  );
}
