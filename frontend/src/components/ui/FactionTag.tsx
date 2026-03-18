import { FACTION_ICON_MAP } from '@/assets/faction';
import EntityTagBadge from '@/components/ui/EntityTagBadge';
import { FACTION_COLOR } from '@/constants/colors';
import type { FactionName } from '@/types/faction';
import { memo } from 'react';

export interface FactionTagProps {
  faction: FactionName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function FactionTag({ faction, size = 'sm' }: FactionTagProps) {
  return (
    <EntityTagBadge
      label={faction}
      color={FACTION_COLOR[faction]}
      iconSrc={FACTION_ICON_MAP[faction]}
      size={size}
    />
  );
}

export default memo(FactionTag);
