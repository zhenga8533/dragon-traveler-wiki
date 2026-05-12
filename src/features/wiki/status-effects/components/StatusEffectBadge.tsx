import { Badge, Group, Stack, Text } from '@mantine/core';
import { getStatusEffectIcon } from '@/assets';
import { STATE_COLOR } from '@/constants/colors';
import { WHITE_SPACE_PRE_LINE_STYLE } from '@/constants/styles';
import { IMAGE_SIZE, POPOVER_BADGE_WIDTH } from '@/constants/ui';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { normalizeName } from '@/utils';
import IconBadge from '@/components/ui/IconBadge';
import RichText from '@/components/common/RichText';
import SafeImage from '@/components/ui/SafeImage';

export interface StatusEffectBadgeProps {
  name: string;
  statusEffects: StatusEffect[];
  displayName?: string;
  disablePopover?: boolean;
}

export default function StatusEffectBadge({
  name,
  statusEffects,
  displayName,
  disablePopover,
}: StatusEffectBadgeProps) {
  const effect = statusEffects.find(
    (e) => normalizeName(e.name) === normalizeName(name)
  );

  if (!effect) {
    return (
      <Badge variant="light" color="gray" size="sm" component="span">
        {displayName ?? name}
      </Badge>
    );
  }

  const color = STATE_COLOR[effect.type];
  const iconSrc = effect.icon !== false ? getStatusEffectIcon(effect.name, effect.type) : undefined;

  if (disablePopover) {
    return (
      <Badge variant="light" color={color} size="sm" component="span">
        {displayName ?? name}
      </Badge>
    );
  }

  return (
    <IconBadge
      label={displayName ?? name}
      color={color}
      size="sm"
      iconSrc={iconSrc}
      component="span"
      popoverContent={
        <Stack gap="xs" maw={POPOVER_BADGE_WIDTH}>
          <Group gap="xs" wrap="nowrap">
            <SafeImage src={iconSrc} alt={effect.name} w={IMAGE_SIZE.ICON_LG} h={IMAGE_SIZE.ICON_LG} />
            <Text fw={600} size="sm">
              {effect.name}
            </Text>
            <Badge variant="light" color={color} size="xs">
              {effect.type}
            </Badge>
          </Group>
          <RichText
            text={effect.effect}
            statusEffects={statusEffects}
            disablePopovers
          />
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
