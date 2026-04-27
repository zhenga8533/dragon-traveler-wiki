import { QUALITY_ICON_MAP } from '@/assets';
import { Image, Tooltip } from '@mantine/core';
import { memo } from 'react';
import { useMobileTooltip } from '@/hooks';

interface QualityIconProps {
  quality: keyof typeof QUALITY_ICON_MAP;
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
    <Image
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
