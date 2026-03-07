import { Image, Tooltip } from '@mantine/core';
import { memo } from 'react';
import { QUALITY_ICON_MAP } from '../../assets/quality';

interface QualityIconProps {
  quality: keyof typeof QUALITY_ICON_MAP;
  size?: number;
}

function QualityIcon({ quality, size = 20 }: QualityIconProps) {
  return (
    <Tooltip label={quality}>
      <Image
        src={QUALITY_ICON_MAP[quality]}
        alt={quality}
        h={size}
        w="auto"
        fit="contain"
        loading="lazy"
      />
    </Tooltip>
  );
}

export default memo(QualityIcon);
