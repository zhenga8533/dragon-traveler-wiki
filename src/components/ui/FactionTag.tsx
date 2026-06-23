import { FACTION_ICON_MAP } from '@/assets';
import EntityTagBadge from '@/components/ui/EntityTagBadge';
import { FACTION_COLOR } from '@/constants/colors';
import { FACTION_SLUG_TO_NAME } from '@/types/faction';
import type { FactionSlug } from '@/types/faction';
import { memo } from 'react';

export interface FactionTagProps {
  faction: FactionSlug;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function FactionTag({ faction, size = 'sm' }: FactionTagProps) {
  return (
    <EntityTagBadge
      label={FACTION_SLUG_TO_NAME[faction]}
      color={FACTION_COLOR[faction]}
      iconSrc={FACTION_ICON_MAP[faction]}
      size={size}
    />
  );
}

export default memo(FactionTag);
