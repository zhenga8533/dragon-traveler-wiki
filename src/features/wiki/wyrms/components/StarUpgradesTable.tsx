import { COMPACT_COL_STYLE } from '@/constants/styles';
import type { Wyrm } from '@/features/wiki/wyrms/types';
import { Stack, Table, Text, Title } from '@mantine/core';

export default function StarUpgradesTable({ wyrm }: { wyrm: Wyrm }) {
  if (wyrm.star_upgrades.length === 0) return null;
  return (
    <Stack gap="md">
      <Title order={2} size="h3">
        Star Upgrades
      </Title>
      <Table striped withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={COMPACT_COL_STYLE}>Stars</Table.Th>
            <Table.Th>Effect</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {wyrm.star_upgrades.map((upgrade) => (
            <Table.Tr key={upgrade.star}>
              <Table.Td style={COMPACT_COL_STYLE}>
                <Text fw={600} size="sm">★{upgrade.star}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{upgrade.description}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
