import { getWyrmspellIcon } from '@/assets';
import { WYRMSPELL_TYPE_COLOR } from '@/constants/wyrmspell-colors';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { useDataFetch } from '@/hooks';
import { normalizeName } from '@/utils';
import type { MantineSize } from '@mantine/core';
import { Badge, Group, Image, Stack, Text } from '@mantine/core';
import FactionTag from './FactionTag';
import IconBadge from './IconBadge';
import QualityIcon from './QualityIcon';

export interface WyrmspellBadgeProps {
  name: string;
  size?: MantineSize;
}

export default function WyrmspellBadge({
  name,
  size = 'sm',
}: WyrmspellBadgeProps) {
  const { data: wyrmspells } = useDataFetch<Wyrmspell[]>(
    'data/wyrmspells.json',
    []
  );

  const wyrmspell =
    wyrmspells.find(
      (entry) => normalizeName(entry.name) === normalizeName(name)
    ) ?? undefined;

  const iconSrc = getWyrmspellIcon(name);
  const color = wyrmspell ? WYRMSPELL_TYPE_COLOR[wyrmspell.type] : 'gray';

  return (
    <IconBadge
      label={name}
      color={color}
      size={size}
      iconSrc={iconSrc ?? undefined}
      popoverContent={
        wyrmspell ? (
          <Stack gap="xs">
            <Group gap="xs" wrap="nowrap">
              {iconSrc && (
                <Image
                  src={iconSrc}
                  alt={name}
                  w={32}
                  h={32}
                  fit="contain"
                  radius="sm"
                />
              )}
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Text size="sm" fw={700} lh={1.2}>
                  {wyrmspell.name}
                </Text>
                <Group gap={6} wrap="wrap">
                  <Badge variant="light" color={color} size="xs">
                    {wyrmspell.type}
                  </Badge>
                  <QualityIcon quality={wyrmspell.quality} size={16} />
                  {wyrmspell.exclusive_faction && (
                    <FactionTag
                      faction={wyrmspell.exclusive_faction}
                      size="xs"
                    />
                  )}
                </Group>
              </Stack>
            </Group>

            <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
              {wyrmspell.effect}
            </Text>
          </Stack>
        ) : undefined
      }
    />
  );
}
