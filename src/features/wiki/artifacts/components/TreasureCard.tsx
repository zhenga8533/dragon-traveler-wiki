import SafeImage from '@/components/ui/SafeImage';
import { getTreasureIcon } from '@/assets';
import ClassTag from '@/components/ui/ClassTag';
import RichText from '@/components/common/RichText';
import EffectTable from '@/features/wiki/artifacts/components/EffectTable';
import type { ArtifactTreasure } from '@/features/wiki/artifacts/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { getCardHoverProps } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import { Group, Paper, Stack, Text } from '@mantine/core';

interface TreasureCardProps {
  treasure: ArtifactTreasure;
  artifactSlug: string;
  isDark: boolean;
  qualityColor: string;
  statusEffects: StatusEffect[];
}

export default function TreasureCard({
  treasure,
  artifactSlug,
  isDark,
  qualityColor,
  statusEffects,
}: TreasureCardProps) {
  const iconSrc = getTreasureIcon(artifactSlug, treasure.name);
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
      <Stack gap="md">
        <Group gap="md" wrap="nowrap" align="flex-start">
          {iconSrc && (
            <SafeImage
              src={iconSrc}
              alt={treasure.name}
              w={IMAGE_SIZE.CARD_ICON}
              h={IMAGE_SIZE.CARD_ICON}
              fit="contain"
              radius="sm"
              style={{ flexShrink: 0 }}
              loading="lazy"
            />
          )}
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="lg">
              {treasure.name}
            </Text>
            <ClassTag characterClass={treasure.character_class} size="sm" />
          </Stack>
        </Group>
        <RichText text={treasure.lore} statusEffects={statusEffects} italic lineHeight={1.6} />
        <EffectTable effects={treasure.effect} statusEffects={statusEffects} />
      </Stack>
    </Paper>
  );
}
