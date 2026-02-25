import { Image, Tooltip } from '@mantine/core';
import { QUALITY_ICON_MAP } from '../../assets/quality';

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
        loading="lazy"
      />
    </Tooltip>
  );
}
