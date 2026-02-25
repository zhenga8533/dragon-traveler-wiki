import { type ReactNode } from 'react';
import { Text } from '@mantine/core';
import DataFetchError from '../common/DataFetchError';
import { ListPageLoading } from './PageLoadingSkeleton';

interface ListPageShellProps {
  loading: boolean;
  error?: Error | null;
  hasData: boolean;
  emptyMessage: string;
  errorTitle?: string;
  skeletonCards?: number;
  children: ReactNode;
}

export default function ListPageShell({
  loading,
  error,
  hasData,
  emptyMessage,
  errorTitle = 'Could not load data',
  skeletonCards = 4,
  children,
}: ListPageShellProps) {
  if (loading) return <ListPageLoading cards={skeletonCards} />;
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
