import DataFetchError from '@/components/ui/DataFetchError';
import { Stack, Text } from '@mantine/core';
import { type ReactNode } from 'react';
import { CardGridLoading, ListPageLoading } from './PageLoadingSkeleton';

interface ListPageShellProps {
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  hasData: boolean;
  emptyMessage: string;
  errorTitle?: string;
  skeletonCards?: number;
  skeletonType?: 'list' | 'grid';
  skeletonCardHeight?: number;
  skeletonCols?: number | Partial<Record<string, number>>;
  children: ReactNode;
}

export default function ListPageShell({
  loading,
  error,
  onRetry,
  hasData,
  emptyMessage,
  errorTitle = 'Could not load data',
  skeletonCards = 4,
  skeletonType = 'list',
  skeletonCardHeight,
  skeletonCols,
  children,
}: ListPageShellProps) {
  if (loading) {
    return skeletonType === 'grid' ? (
      <CardGridLoading
        cards={skeletonCards}
        cardHeight={skeletonCardHeight}
        cols={skeletonCols}
      />
    ) : (
      <ListPageLoading cards={skeletonCards} />
    );
  }
  if (error) {
    return (
      <DataFetchError
        title={errorTitle}
        message={error.message}
        onRetry={onRetry ?? (() => window.location.reload())}
      />
    );
  }
  if (!hasData) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">{emptyMessage}</Text>
      </Stack>
    );
  }
  return <>{children}</>;
}
