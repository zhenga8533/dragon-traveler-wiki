import { Badge, Image } from '@mantine/core';
import { CLASS_ICON_MAP } from '../../assets/class';
import type { CharacterClass } from '../../types/character';

export interface ClassTagProps {
  characterClass: CharacterClass | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
}

export default function ClassTag({
  characterClass,
  size = 'sm',
  showIcon = true,
}: ClassTagProps) {
  const icon = (CLASS_ICON_MAP as Record<string, string | undefined>)[characterClass];

  return (
    <Badge
      variant="light"
      size={size}
      leftSection={
        showIcon && icon ? (
          <Image src={icon} alt={characterClass} w={12} h={12} fit="contain" loading="lazy" />
        ) : undefined
      }
    >
      {characterClass}
    </Badge>
  );
}
