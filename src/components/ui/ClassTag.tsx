import { CLASS_ICON_MAP } from '@/assets';
import IconBadge from '@/components/ui/IconBadge';
import { CLASS_COLOR } from '@/constants/class-colors';
import type { CharacterClass } from '@/features/characters/types';
import { useGradientAccent } from '@/hooks';
import { memo } from 'react';

export interface ClassTagProps {
  characterClass: CharacterClass | string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
}

function ClassTag({
  characterClass,
  color,
  size = 'sm',
  showIcon = true,
}: ClassTagProps) {
  const { accent } = useGradientAccent();
  const classColor = (CLASS_COLOR as Record<string, string | undefined>)[
    characterClass
  ];
  const iconSrc = showIcon
    ? (CLASS_ICON_MAP as Record<string, string | undefined>)[characterClass]
    : undefined;

  const label = `${characterClass.charAt(0).toUpperCase()}${characterClass.slice(1)}`;

  return (
    <IconBadge
      label={label}
      color={color ?? classColor ?? accent.secondary}
      iconSrc={iconSrc}
      size={size}
    />
  );
}

export default memo(ClassTag);
