import { CLASS_ICON_MAP } from '@/assets/class';
import { FACTION_ICON_MAP } from '@/assets/faction';
import { CLASS_ORDER, FACTION_NAMES, QUALITY_ORDER } from '@/constants/colors';
import { IMAGE_SIZE } from '@/constants/ui';
import QualityFilterIcon from '@/features/characters/components/QualityFilterIcon';
import type { CharacterClass } from '@/features/characters/types';
import type { FactionName } from '@/types/faction';
import type { Quality } from '@/types/quality';
import { Image } from '@mantine/core';
import type { ReactNode } from 'react';

export interface ChipFilterGroup {
  key: string;
  label: string;
  options: string[];
  icon?: (value: string) => ReactNode;
}

interface BaseFilterGroupOptions {
  key?: string;
  label?: string;
}

interface OrderedFilterGroupOptions<
  T extends string,
> extends BaseFilterGroupOptions {
  options?: readonly T[];
}

export function orderFilterOptions<T extends string>(
  options: Iterable<T>,
  preferredOrder: readonly T[]
): T[] {
  const orderIndex = new Map(
    preferredOrder.map((value, index) => [value, index] as const)
  );

  return [...new Set(options)].sort((left, right) => {
    const leftIndex = orderIndex.get(left);
    const rightIndex = orderIndex.get(right);

    if (leftIndex !== undefined || rightIndex !== undefined) {
      if (leftIndex === undefined) return 1;
      if (rightIndex === undefined) return -1;
      return leftIndex - rightIndex;
    }

    return left.localeCompare(right);
  });
}

export function createQualityFilterGroup({
  key = 'qualities',
  label = 'Quality',
  options = QUALITY_ORDER,
}: OrderedFilterGroupOptions<Quality> = {}): ChipFilterGroup {
  return {
    key,
    label,
    options: [...options],
    icon: (value: string) => <QualityFilterIcon value={value} />,
  };
}

export function createClassFilterGroup({
  key = 'classes',
  label = 'Class',
  options = CLASS_ORDER,
}: OrderedFilterGroupOptions<CharacterClass> = {}): ChipFilterGroup {
  return {
    key,
    label,
    options: [...options],
    icon: (value: string) => {
      const iconSrc =
        CLASS_ICON_MAP[value as CharacterClass] ??
        (CLASS_ICON_MAP as Record<string, string | undefined>)[value];

      return iconSrc ? (
        <Image
          src={iconSrc}
          alt={value}
          w={IMAGE_SIZE.ICON_SM}
          h={IMAGE_SIZE.ICON_SM}
          fit="contain"
        />
      ) : null;
    },
  };
}

export function createFactionFilterGroup({
  key = 'factions',
  label = 'Faction',
  options = FACTION_NAMES,
}: OrderedFilterGroupOptions<FactionName> = {}): ChipFilterGroup {
  return {
    key,
    label,
    options: [...options],
    icon: (value: string) => {
      const iconSrc =
        FACTION_ICON_MAP[value as FactionName] ??
        (FACTION_ICON_MAP as Record<string, string | undefined>)[value];

      return iconSrc ? (
        <Image
          src={iconSrc}
          alt={value}
          w={IMAGE_SIZE.ICON_SM}
          h={IMAGE_SIZE.ICON_SM}
          fit="contain"
        />
      ) : null;
    },
  };
}
