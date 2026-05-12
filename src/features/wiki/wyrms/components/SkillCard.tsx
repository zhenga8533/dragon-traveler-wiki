import SafeImage from '@/components/ui/SafeImage';
import RichText from '@/components/common/RichText';
import { getCardHoverProps } from '@/constants/styles';
import { getWyrmSkillIcon } from '@/assets';
import type { Wyrm } from '@/features/wiki/wyrms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { Group, Paper, Stack, Text } from '@mantine/core';

export default function SkillCard({
  wyrm,
  skill,
  statusEffects,
}: {
  wyrm: Wyrm;
  skill: Wyrm['skills'][number];
  statusEffects: StatusEffect[];
}) {
  const iconSrc = getWyrmSkillIcon(wyrm.name, skill.name);

  return (
    <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
      <Stack gap="md">
        <Group gap="md" wrap="nowrap" align="flex-start">
          {iconSrc && (
            <SafeImage
              src={iconSrc}
              alt={skill.name}
              w={48}
              h={48}
              fit="contain"
              radius="sm"
              style={{ flexShrink: 0 }}
            />
          )}
          <Text fw={700} size="lg" style={{ lineHeight: 1.3 }}>
            {skill.name}
          </Text>
        </Group>
        <RichText text={skill.description} statusEffects={statusEffects} />
      </Stack>
    </Paper>
  );
}
