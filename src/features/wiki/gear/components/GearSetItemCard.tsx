import ExpandableText from '@/components/ui/ExpandableText';
import SafeImage from '@/components/ui/SafeImage';
import { getGearIcon } from '@/assets';
import RichText from '@/components/common/RichText';
import QualityIcon from '@/components/ui/QualityIcon';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import type { Gear } from '@/features/wiki/gear/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { QUALITY_COLOR } from '@/constants/quality';
import { getCardHoverProps } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import { Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';

interface GearSetItemCardProps {
  item: Gear;
  isDark: boolean;
  statusEffects: StatusEffect[];
}

export default function GearSetItemCard({
  item,
  isDark,
  statusEffects,
}: GearSetItemCardProps) {
  const iconSrc = getGearIcon(item.type, item.slug);
  const qualityColor = QUALITY_COLOR[item.quality];
  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      {...getCardHoverProps({
        style: {
          borderTop: `3px solid var(--mantine-color-${qualityColor}-${isDark ? 7 : 5})`,
        },
      })}
    >
      <Stack gap="sm">
        <Group gap="md" wrap="nowrap" align="flex-start">
          {iconSrc && (
            <SafeImage
              src={iconSrc}
              alt={item.name}
              w={IMAGE_SIZE.CARD_ICON}
              h={IMAGE_SIZE.CARD_ICON}
              fit="contain"
              radius="sm"
              loading="lazy"
            />
          )}
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="lg" className="dt-link-text" lineClamp={1}>
              {item.name}
            </Text>
            <Group gap="xs" wrap="wrap">
              <GearTypeTag type={item.type} />
              <QualityIcon quality={item.quality} size={IMAGE_SIZE.ICON_LG} />
            </Group>
            <ExpandableText size="sm">
              <RichText text={item.lore} statusEffects={statusEffects} italic />
            </ExpandableText>
          </Stack>
        </Group>

        <Stack gap="xs">
          <Text fw={600} size="sm">
            Stats
          </Text>
          <SimpleGrid cols={2} spacing="xs">
            {Object.entries(item.stats).map(([statName, statValue]) => (
              <Paper key={statName} withBorder radius="sm" p="xs" {...getCardHoverProps()}>
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {statName}
                  </Text>
                  <Text size="sm" fw={700} lineClamp={1}>
                    {String(statValue)}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Stack>
    </Paper>
  );
}
