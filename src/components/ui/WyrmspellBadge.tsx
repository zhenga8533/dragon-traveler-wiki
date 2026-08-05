import { getWyrmspellIcon } from '@/assets';
import RichText from '@/components/common/RichText';
import { WYRMSPELL_TYPE_COLOR } from '@/constants/wyrmspell-colors';
import { getMaxQuality } from '@/features/wiki/wyrmspells/types';
import {
  useStatusEffects,
  useWyrmspells,
} from '@/features/wiki/hooks/use-wiki-data';
import type { MantineSize } from '@mantine/core';
import { Anchor, Badge, Group, Stack, Text } from '@mantine/core';
import SafeImage from './SafeImage';
import FactionTag from './FactionTag';
import IconBadge from './IconBadge';
import QualityIcon from './QualityIcon';
import { Link } from 'react-router';

export interface WyrmspellBadgeProps {
  /** Wyrmspell slug (e.g. "agility_aura") — the canonical key in wyrmspells.json. */
  slug: string;
  size?: MantineSize;
}

export default function WyrmspellBadge({
  slug,
  size = 'sm',
}: WyrmspellBadgeProps) {
  const { data: wyrmspells } = useWyrmspells();
  const { data: statusEffects } = useStatusEffects();

  const wyrmspell = wyrmspells.find((entry) => entry.slug === slug);
  const label = wyrmspell?.name ?? slug;

  const iconSrc = getWyrmspellIcon(slug, wyrmspell?.type);
  const color = wyrmspell ? WYRMSPELL_TYPE_COLOR[wyrmspell.type] : 'gray';
  const maxQuality = wyrmspell ? getMaxQuality(wyrmspell) : null;

  return (
    <IconBadge
      label={label}
      color={color}
      size={size}
      iconSrc={iconSrc ?? undefined}
      popoverContent={
        wyrmspell ? (
          <Stack gap="xs">
            <Group gap="xs" wrap="nowrap">
              {iconSrc && (
                <SafeImage
                  src={iconSrc}
                  alt={label}
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
                  {maxQuality && (
                    <QualityIcon quality={maxQuality.quality} size={16} />
                  )}
                  {wyrmspell.exclusive_faction && (
                    <FactionTag
                      faction={wyrmspell.exclusive_faction}
                      size="xs"
                    />
                  )}
                </Group>
              </Stack>
            </Group>

            {maxQuality && (
              <RichText
                text={maxQuality.effect}
                statusEffects={statusEffects}
                disablePopovers
              />
            )}

            <Anchor component={Link} to={`/wyrmspells/${slug}`} size="xs">
              View details →
            </Anchor>
          </Stack>
        ) : undefined
      }
    />
  );
}
