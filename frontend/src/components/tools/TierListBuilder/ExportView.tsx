import { Badge, Box, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import CharacterCard from '../../character/CharacterCard';
import { getTierColor } from '../../../constants/colors';
import type { Quality } from '../../../types/quality';

export interface TierExportRow {
  tier: string;
  tierIndex: number;
  note?: string;
  entries: Array<{
    characterName: string;
    characterQuality?: Quality | null;
    label?: string;
  }>;
}

export function TierListExportView({
  tierListName,
  author,
  tierRows,
}: {
  tierListName: string;
  author?: string;
  tierRows: TierExportRow[];
}) {
  return (
    <Stack gap="xs">
      <Box>
        <Text fw={700} size="xl" lh={1.2}>
          {tierListName}
        </Text>
        {author && (
          <Text size="sm" c="dimmed">
            by {author}
          </Text>
        )}
      </Box>
      <Stack gap="md">
        {tierRows.map(({ tier, tierIndex, note, entries }) => {
          const color = getTierColor(tier, tierIndex);
          return (
            <Paper key={tier} withBorder p="md" radius="md">
              <Stack gap="sm">
                <Stack gap={4}>
                  <Badge variant="filled" color={color} size="lg" radius="sm">
                    {tier} Tier
                  </Badge>
                  {note?.trim() && (
                    <Text size="xs" c="dimmed">
                      {note}
                    </Text>
                  )}
                </Stack>
                <SimpleGrid cols={4} spacing="xs">
                  {entries.map((entry, i) => (
                    <CharacterCard
                      key={i}
                      name={entry.characterName}
                      label={entry.label}
                      quality={entry.characterQuality ?? undefined}
                      disableLink
                    />
                  ))}
                </SimpleGrid>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}
