import { QUALITY_ICON_MAP } from '@/assets';
import { Tooltip } from '@mantine/core';
import SafeImage from './SafeImage';
import { memo } from 'react';
import { useMobileTooltip } from '@/hooks';
import type { Quality } from '@/types/quality';

interface QualityIconProps {
  quality: Quality;
  size?: number;
  showTooltip?: boolean;
}

function QualityIcon({
  quality,
  size = 20,
  showTooltip = true,
}: QualityIconProps) {
  const mobileTooltip = useMobileTooltip();
  const src = QUALITY_ICON_MAP[quality];
  if (!src) return null;

  const image = (
    <SafeImage
      src={src}
      alt={quality}
      h={size}
      w="auto"
      fit="contain"
      loading="lazy"
    />
  );
  return showTooltip ? <Tooltip label={quality} {...mobileTooltip}>{image}</Tooltip> : image;
}

export default memo(QualityIcon);
