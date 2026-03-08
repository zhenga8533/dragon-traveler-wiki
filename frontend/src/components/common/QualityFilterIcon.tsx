import { Image } from '@mantine/core';
import { memo } from 'react';
import { QUALITY_ICON_MAP } from '../../assets/quality';

interface QualityFilterIconProps {
  value: string;
}

function QualityFilterIcon({ value }: QualityFilterIconProps) {
  const iconSrc = QUALITY_ICON_MAP[value as keyof typeof QUALITY_ICON_MAP];
  if (!iconSrc) return null;

  return <Image src={iconSrc} alt={value} w={14} h={14} fit="contain" />;
}

export default memo(QualityFilterIcon);
