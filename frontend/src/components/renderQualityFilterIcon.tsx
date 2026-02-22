import { Image } from '@mantine/core';
import type { ReactNode } from 'react';
import { QUALITY_ICON_MAP } from '../assets/quality';

/** Renders a small quality icon for use as a filter-chip icon. */
export function renderQualityFilterIcon(value: string): ReactNode {
  const iconSrc = QUALITY_ICON_MAP[value as keyof typeof QUALITY_ICON_MAP];
  if (!iconSrc) return null;
  return <Image src={iconSrc} alt={value} w={14} h={14} fit="contain" />;
}
