import { Image, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import { QUALITY_ICON_MAP } from '../assets/quality';

interface QualityIconProps {
  quality: keyof typeof QUALITY_ICON_MAP;
  size?: number;
}

export default function QualityIcon({ quality, size = 20 }: QualityIconProps) {
  return (
    <Tooltip label={quality}>
      <Image
        src={QUALITY_ICON_MAP[quality]}
        alt={quality}
        h={size}
        w="auto"
        fit="contain"
      />
    </Tooltip>
  );
}

/** Renders a small quality icon for use as a filter-chip icon. */
export function renderQualityFilterIcon(value: string): ReactNode {
  const iconSrc = QUALITY_ICON_MAP[value as keyof typeof QUALITY_ICON_MAP];
  if (!iconSrc) return null;
  return <Image src={iconSrc} alt={value} w={14} h={14} fit="contain" />;
}
