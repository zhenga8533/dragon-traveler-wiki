import IconBadge from '@/components/ui/IconBadge';
import { RELIC_TYPE_ICON_MAP } from '@/assets';
import { RELIC_TYPE_COLOR } from '@/constants/relic-colors';
import type { RelicType } from '@/features/wiki/relics/types';
import { useGradientAccent } from '@/hooks';
import { memo } from 'react';

export interface RelicTypeTagProps {
  type: RelicType;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function RelicTypeTag({ type, color, size = 'sm' }: RelicTypeTagProps) {
  const { accent } = useGradientAccent();

  return (
    <IconBadge
      label={type}
      color={color ?? RELIC_TYPE_COLOR[type] ?? accent.primary}
      iconSrc={RELIC_TYPE_ICON_MAP[type]}
      size={size}
    />
  );
}

export default memo(RelicTypeTag);
