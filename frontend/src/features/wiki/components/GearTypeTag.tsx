import { GEAR_TYPE_ICON_MAP } from '@/assets/gear';
import EntityTagBadge from '@/components/ui/EntityTagBadge';
import { GEAR_TYPE_COLOR } from '@/constants/colors';
import type { GearType } from '@/features/wiki/types/gear';
import { useGradientAccent } from '@/hooks';
import { memo } from 'react';

export interface GearTypeTagProps {
  type: GearType;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function GearTypeTag({ type, color, size = 'sm' }: GearTypeTagProps) {
  const { accent } = useGradientAccent();

  return (
    <EntityTagBadge
      label={type}
      color={color ?? GEAR_TYPE_COLOR[type] ?? accent.primary}
      iconSrc={GEAR_TYPE_ICON_MAP[type]}
      size={size}
    />
  );
}

export default memo(GearTypeTag);
