import { Badge, Group, Image, Paper, Stack, Text } from '@mantine/core';
import { getWyrmspellIcon } from '../../assets/wyrmspell';
import {
  WYRMSPELL_TYPE_COLOR,
  getStableTagColor,
} from '../../constants/colors';
import { getCardHoverProps } from '../../constants/styles';
import type { Wyrmspell } from '../../types/wyrmspell';
import FactionTag from './FactionTag';
import QualityIcon from './QualityIcon';

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

  return (
    <Paper p="sm" radius="md" withBorder {...getCardHoverProps()}>
      <Stack gap="xs" align="center">
        {iconSrc && (
          <Image
            src={iconSrc}
            alt={name}
            w={48}
            h={48}
            fit="contain"
            loading="lazy"
          />
        )}
        <Group gap={4} justify="center" align="center">
          {quality && <QualityIcon quality={quality} />}
          <Text size="sm" fw={600} ta="center">
            {name}
          </Text>
        </Group>
        <Group gap={4} justify="center">
          <Badge
            variant="light"
            size="sm"
            color={
              WYRMSPELL_TYPE_COLOR[
                displayType as keyof typeof WYRMSPELL_TYPE_COLOR
              ] ?? getStableTagColor(displayType)
            }
          >
            {displayType}
          </Badge>
          {wyrmspell?.exclusive_faction && (
            <FactionTag faction={wyrmspell.exclusive_faction} size="xs" />
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
