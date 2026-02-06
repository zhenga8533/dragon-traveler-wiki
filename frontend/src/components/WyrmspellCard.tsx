import { Badge, Image, Paper, Stack, Text } from '@mantine/core';
import { getWyrmspellIcon } from '../assets/wyrmspell';
import type { Wyrmspell } from '../types/wyrmspell';

interface WyrmspellCardProps {
  name: string;
  type?: string;
  wyrmspells?: Wyrmspell[];
}

export default function WyrmspellCard({
  name,
  type,
  wyrmspells = [],
}: WyrmspellCardProps) {
  const wyrmspell = wyrmspells.find((w) => w.name === name);
  const iconSrc = getWyrmspellIcon(name);
  const displayType = type || wyrmspell?.type || 'Unknown';

  return (
    <Paper p="sm" radius="md" withBorder>
      <Stack gap="xs" align="center">
        {iconSrc && (
          <Image src={iconSrc} alt={name} w={48} h={48} fit="contain" />
        )}
        <Text size="sm" fw={600} ta="center">
          {name}
        </Text>
        <Badge variant="light" size="sm">
          {displayType}
        </Badge>
        {wyrmspell && (
          <Text size="xs" c="dimmed" ta="center" lineClamp={2}>
            {wyrmspell.effect}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
