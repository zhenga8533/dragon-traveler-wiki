import { Badge, Group, Stack, Text } from '@mantine/core';
import { getStatusEffectIcon } from '@/assets';
import { STATE_COLOR } from '@/constants/status-effect-colors';
import {
  RICH_TEXT_BADGE_STYLE,
  WHITE_SPACE_PRE_LINE_STYLE,
} from '@/constants/styles';
import { IMAGE_SIZE, POPOVER_BADGE_WIDTH } from '@/constants/ui';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import IconBadge from '@/components/ui/IconBadge';
import RichText from '@/components/common/RichText';
import SafeImage from '@/components/ui/SafeImage';

export interface StatusEffectBadgeProps {
  /** Status effect slug (e.g. "taunt") — the canonical key in status-effects.json. */
  slug: string;
  statusEffects: StatusEffect[];
  displayName?: string;
  disablePopover?: boolean;
}

export default function StatusEffectBadge({
  slug,
  statusEffects,
  displayName,
  disablePopover,
}: StatusEffectBadgeProps) {
  const effect = statusEffects.find((e) => e.slug === slug);
  const label = displayName ?? effect?.name ?? slug;

  if (!effect) {
    return (
      <Badge
        variant="light"
        color="gray"
        size="sm"
        component="span"
        style={RICH_TEXT_BADGE_STYLE}
      >
        {label}
      </Badge>
    );
  }

  const color = STATE_COLOR[effect.type];
  const iconSrc = effect.icon !== false ? getStatusEffectIcon(effect.slug, effect.type) : undefined;

  if (disablePopover) {
    return (
      <Badge
        variant="light"
        color={color}
        size="sm"
        component="span"
        style={RICH_TEXT_BADGE_STYLE}
      >
        {label}
      </Badge>
    );
  }

  return (
    <IconBadge
      label={label}
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
