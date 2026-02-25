import { Badge, Image } from '@mantine/core';
import { GEAR_TYPE_ICON_MAP } from '../../assets/gear';
import type { GearType } from '../../types/gear';

export interface GearTypeTagProps {
  type: GearType;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function GearTypeTag({
  type,
  color = 'blue',
  size = 'sm',
}: GearTypeTagProps) {
  const icon = GEAR_TYPE_ICON_MAP[type];

  return (
    <Badge
      variant="light"
      color={color}
      size={size}
      leftSection={
        icon ? (
          <Image src={icon} alt={type} w={12} h={12} fit="contain" loading="lazy" />
        ) : undefined
      }
    >
      {type}
    </Badge>
  );
}
