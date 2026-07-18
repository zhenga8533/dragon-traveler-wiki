import { WYRMSPELL_TYPE_ICON_MAP } from '@/assets';
import IconBadge from '@/components/ui/IconBadge';
import { getStableTagColor } from '@/constants/tag-colors';
import { WYRMSPELL_TYPE_COLOR } from '@/constants/wyrmspell-colors';
import type { WyrmspellType } from '@/features/wiki/wyrmspells/types';
import { memo } from 'react';

interface WyrmspellTypeTagProps {
  type: WyrmspellType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function WyrmspellTypeTag({ type, size = 'sm' }: WyrmspellTypeTagProps) {
  return (
    <IconBadge
      label={type}
      color={WYRMSPELL_TYPE_COLOR[type] ?? getStableTagColor(type)}
      iconSrc={WYRMSPELL_TYPE_ICON_MAP[type]}
      size={size}
    />
  );
}

export default memo(WyrmspellTypeTag);
