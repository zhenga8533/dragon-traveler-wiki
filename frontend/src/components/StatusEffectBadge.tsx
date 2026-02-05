import { Badge, Popover, Stack, Group, Text, Image } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { STATE_COLOR } from '../constants/colors';
import type { StatusEffect } from '../types/status-effect';

export interface StatusEffectBadgeProps {
  name: string;
  statusEffects: StatusEffect[];
}

export default function StatusEffectBadge({
  name,
  statusEffects,
}: StatusEffectBadgeProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const effect = statusEffects.find((e) => e.name === name);

  if (!effect) {
    return (
      <Badge variant="light" color="gray" size="sm" component="span">
        {name}
      </Badge>
    );
  }

  const color = STATE_COLOR[effect.type];

  return (
    <Popover opened={opened} position="top" withArrow shadow="md">
      <Popover.Target>
        <Badge
          variant="light"
          color={color}
          size="sm"
          component="span"
          style={{ cursor: 'pointer' }}
          onMouseEnter={open}
          onMouseLeave={close}
        >
          {name}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: 'none' }}>
        <Stack gap="xs" maw={280}>
          <Group gap="xs" wrap="nowrap">
            {effect.icon && (
              <Image src={effect.icon} alt={effect.name} w={24} h={24} fit="contain" />
            )}
            <Text fw={600} size="sm">{effect.name}</Text>
            <Badge variant="light" color={color} size="xs">{effect.type}</Badge>
          </Group>
          <Text size="xs">{effect.effect}</Text>
          {effect.remark && (
            <Text size="xs" c="dimmed" fs="italic">{effect.remark}</Text>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
