import SafeImage from '@/components/ui/SafeImage';
import { InteractiveSurface, StaticSurface } from '@/components/ui/Surface';
import { LINK_BLOCK_RESET_STYLE } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import { Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface EntitySummaryCardProps {
  /** Omit (or pass null) to render a non-interactive card, e.g. when no linked entity exists yet. */
  to?: string | null;
  title: string;
  imageSrc?: string;
  imageAlt?: string;
  titleAccessory?: ReactNode;
  metadata?: ReactNode;
  description?: ReactNode;
}

/** Shared visual hierarchy for entity cards used across database lists. */
export default function EntitySummaryCard({
  to,
  title,
  imageSrc,
  imageAlt = title,
  titleAccessory,
  metadata,
  description,
}: EntitySummaryCardProps) {
  const Surface = to ? InteractiveSurface : StaticSurface;

  return (
    <Surface
      p="md"
      {...(to ? { component: Link, to, style: LINK_BLOCK_RESET_STYLE } : {})}
    >
      <Group gap="md" align="flex-start" wrap="nowrap">
        {imageSrc && (
          <SafeImage
            src={imageSrc}
            alt={imageAlt}
            w={IMAGE_SIZE.CARD_ICON}
            h={IMAGE_SIZE.CARD_ICON}
            fit="contain"
            radius="sm"
            loading="lazy"
          />
        )}
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="sm" wrap="wrap">
            <Text
              fw={700}
              className={to ? 'dt-link-text' : undefined}
              lineClamp={1}
            >
              {title}
            </Text>
            {titleAccessory}
          </Group>
          {metadata}
          {description}
        </Stack>
      </Group>
    </Surface>
  );
}
