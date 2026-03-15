import { Badge, Group, Image, Stack, Text } from '@mantine/core';
import { getStatusEffectIcon } from '@/assets/status_effect';
import { STATE_COLOR } from '@/constants/colors';
import { WHITE_SPACE_PRE_LINE_STYLE } from '@/constants/styles';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import IconBadge from '@/components/ui/IconBadge';

export interface StatusEffectBadgeProps {
  name: string;
  statusEffects: StatusEffect[];
}

export default function StatusEffectBadge({
  name,
  statusEffects,
}: StatusEffectBadgeProps) {
  const normalizedName = name.trim().toLowerCase();
  const effect = statusEffects.find(
    (e) => e.name.trim().toLowerCase() === normalizedName
  );

  if (!effect) {
    return (
      <Badge variant="light" color="gray" size="sm" component="span">
        {name}
      </Badge>
    );
  }

  const color = STATE_COLOR[effect.type];
  const iconSrc = getStatusEffectIcon(effect.name);

  return (
    <IconBadge
      label={name}
      color={color}
      size="sm"
      iconSrc={iconSrc ?? undefined}
      component="span"
      popoverContent={
        <Stack gap="xs" maw={280}>
          <Group gap="xs" wrap="nowrap">
            {iconSrc && <Image src={iconSrc} alt={effect.name} w={18} h={18} />}
            <Text fw={600} size="sm">
              {effect.name}
            </Text>
            <Badge variant="light" color={color} size="xs">
              {effect.type}
            </Badge>
          </Group>
          <Text size="xs" style={WHITE_SPACE_PRE_LINE_STYLE}>
            {effect.effect}
          </Text>
          {effect.remark && (
            <Text
              size="xs"
              c="dimmed"
              fs="italic"
              style={WHITE_SPACE_PRE_LINE_STYLE}
            >
              {effect.remark}
            </Text>
          )}
        </Stack>
      }
    />
  );
}
