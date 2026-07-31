import DataFetchError from '@/components/ui/DataFetchError';
import { Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

interface ListPageShellProps {
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  hasData: boolean;
  emptyMessage: string;
  errorTitle?: string;
  loadingFallback: ReactNode;
  children: ReactNode;
}

export default function ListPageShell({
  loading,
  error,
  onRetry,
  hasData,
  emptyMessage,
  errorTitle = 'Could not load data',
  loadingFallback,
  children,
}: ListPageShellProps) {
  if (loading) {
    return <>{loadingFallback}</>;
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
