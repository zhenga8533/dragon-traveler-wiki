import { Badge } from '@mantine/core';
import { QUALITY_COLOR } from '../../constants/quality';

export interface QualityBadgeProps {
  quality: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function QualityBadge({ quality, size = 'sm' }: QualityBadgeProps) {
  const color = (QUALITY_COLOR as Record<string, string>)[quality] ?? 'gray';

  return (
    <Badge variant="light" color={color} size={size}>
      {quality}
    </Badge>
  );
}
