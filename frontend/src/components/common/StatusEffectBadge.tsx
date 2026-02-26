import { Badge, Group, Image, Popover, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getStatusEffectIcon } from '../../assets/status_effect';
import { STATE_COLOR } from '../../constants/colors';
import {
  CURSOR_POINTER_STYLE,
  POINTER_EVENTS_NONE_STYLE,
  WHITE_SPACE_PRE_LINE_STYLE,
} from '../../constants/styles';
import type { StatusEffect } from '../../types/status-effect';

export interface StatusEffectBadgeProps {
  name: string;
  statusEffects: StatusEffect[];
}

export default function StatusEffectBadge({
  name,
  statusEffects,
}: StatusEffectBadgeProps) {
  const [opened, { open, close }] = useDisclosure(false);
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
    <Popover opened={opened} position="top" withArrow shadow="md">
      <Popover.Target>
        <Badge
          variant="light"
          color={color}
          size="sm"
          component="span"
          style={CURSOR_POINTER_STYLE}
          onMouseEnter={open}
          onMouseLeave={close}
          leftSection={
            iconSrc ? (
              <Image src={iconSrc} alt={effect.name} w={14} h={14} />
            ) : undefined
          }
        >
          {name}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown style={POINTER_EVENTS_NONE_STYLE}>
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
      </Popover.Dropdown>
    </Popover>
  );
}
