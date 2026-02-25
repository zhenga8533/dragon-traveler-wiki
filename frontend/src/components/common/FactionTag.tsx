import { Badge, Image } from '@mantine/core';
import { FACTION_ICON_MAP } from '../../assets/faction';
import { FACTION_COLOR } from '../../constants/colors';
import type { FactionName } from '../../types/faction';

export interface FactionTagProps {
  faction: FactionName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function FactionTag({ faction, size = 'sm' }: FactionTagProps) {
  const icon = FACTION_ICON_MAP[faction];
  const color = FACTION_COLOR[faction];

  return (
    <Badge
      variant="light"
      color={color}
      size={size}
      leftSection={
        icon ? (
          <Image src={icon} alt={faction} w={12} h={12} fit="contain" loading="lazy" />
        ) : undefined
      }
    >
      {faction}
    </Badge>
  );
}
