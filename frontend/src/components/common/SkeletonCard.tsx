import { Group, Skeleton, Stack } from '@mantine/core';
import { CHARACTER_CARD } from '../../constants/ui';

interface SkeletonCardProps {
  size?: number;
  showText?: boolean;
}

export function CharacterCardSkeleton({
  size = CHARACTER_CARD.PORTRAIT_SIZE,
  showText = true,
}: SkeletonCardProps) {
  return (
    <Stack gap={2} align="center">
      <Skeleton height={size} width={size} circle />
      {showText && <Skeleton height={14} width={size * 0.8} radius="sm" />}
    </Stack>
  );
}

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return <Skeleton height={height} radius="md" />;
}

export function ListItemSkeleton() {
  return (
    <Group p="sm">
      <Skeleton height={40} width={40} circle />
      <Stack gap={4} style={{ flex: 1 }}>
        <Skeleton height={16} width="60%" radius="sm" />
        <Skeleton height={12} width="40%" radius="sm" />
      </Stack>
    </Group>
  );
}

export function CharacterGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CharacterCardSkeleton key={i} />
      ))}
    </>
  );
}
