import DataFetchError from '@/components/ui/DataFetchError';
import { Text } from '@mantine/core';
import { type ReactNode } from 'react';
import { CardGridLoading, ListPageLoading } from './PageLoadingSkeleton';

interface ListPageShellProps {
  loading: boolean;
  error?: Error | null;
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
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (!hasData) {
    return <Text c="dimmed">{emptyMessage}</Text>;
  }
  return <>{children}</>;
}
