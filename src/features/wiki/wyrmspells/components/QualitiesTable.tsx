import RichText from '@/components/common/RichText';
import QualityIcon from '@/components/ui/QualityIcon';
import { COMPACT_COL_STYLE } from '@/constants/styles';
import type { WyrmspellQuality } from '@/features/wiki/wyrmspells/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { Box, Table } from '@mantine/core';

export default function QualitiesTable({
  qualities,
  statusEffects,
}: {
  qualities: WyrmspellQuality[];
  statusEffects: StatusEffect[];
}) {
  if (qualities.length === 0) return null;
  return (
    <Box style={{ overflowX: 'auto' }}>
      <Table striped withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={COMPACT_COL_STYLE}>Quality</Table.Th>
            <Table.Th>Effect</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {qualities.map((q) => (
            <Table.Tr key={q.quality}>
              <Table.Td style={COMPACT_COL_STYLE}>
                <QualityIcon quality={q.quality} />
              </Table.Td>
              <Table.Td>
                <RichText text={q.effect} statusEffects={statusEffects} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
