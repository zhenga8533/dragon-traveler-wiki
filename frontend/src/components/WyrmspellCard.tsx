import { Badge, Group, Image, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { FACTION_ICON_MAP } from '../assets/faction';
import { QUALITY_ICON_MAP } from '../assets/quality';
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
  const quality = wyrmspell?.quality;
  const factionIcon = wyrmspell?.exclusive_faction
    ? FACTION_ICON_MAP[wyrmspell.exclusive_faction]
    : undefined;

  return (
    <Paper p="sm" radius="md" withBorder>
      <Stack gap="xs" align="center">
        {iconSrc && (
          <Image src={iconSrc} alt={name} w={48} h={48} fit="contain" />
        )}
        <Group gap={4} justify="center" align="center">
          {quality && (
            <Tooltip label={quality}>
              <Image
                src={QUALITY_ICON_MAP[quality]}
                alt={quality}
                h={20}
                w="auto"
                fit="contain"
              />
            </Tooltip>
          )}
          <Text size="sm" fw={600} ta="center">
            {name}
          </Text>
        </Group>
        <Group gap={4} justify="center">
          <Badge variant="light" size="sm">
            {displayType}
          </Badge>
          {wyrmspell?.exclusive_faction && factionIcon && (
            <Tooltip label={wyrmspell.exclusive_faction}>
              <Image
                src={factionIcon}
                alt={wyrmspell.exclusive_faction}
                w={20}
                h={20}
              />
            </Tooltip>
          )}
        </Group>
        {wyrmspell && (
          <Text size="xs" c="dimmed" ta="center" lineClamp={2}>
            {wyrmspell.effect}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
