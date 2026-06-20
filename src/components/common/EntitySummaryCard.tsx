import SafeImage from '@/components/ui/SafeImage';
import { InteractiveSurface } from '@/components/ui/Surface';
import { LINK_BLOCK_RESET_STYLE } from '@/constants/styles';
import { Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EntitySummaryCardProps {
  to: string;
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
  return (
    <InteractiveSurface
      component={Link}
      to={to}
      p="md"
      style={LINK_BLOCK_RESET_STYLE}
    >
      <Group gap="md" align="flex-start" wrap="nowrap">
        {imageSrc && (
          <SafeImage
            src={imageSrc}
            alt={imageAlt}
            w={64}
            h={64}
            fit="contain"
            radius="sm"
            loading="lazy"
          />
        )}
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="sm" wrap="wrap">
            <Text fw={700} className="dt-link-text" lineClamp={1}>
              {title}
            </Text>
            {titleAccessory}
          </Group>
          {metadata}
          {description}
        </Stack>
      </Group>
    </InteractiveSurface>
  );
}
