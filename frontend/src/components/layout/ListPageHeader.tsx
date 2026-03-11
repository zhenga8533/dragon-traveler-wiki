import { Group, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import LastUpdated from '@/components/common/LastUpdated';

interface ListPageHeaderProps {
  title: string;
  timestamp?: number | null;
  /** Right-side content, typically a SuggestModal */
  children?: ReactNode;
}

export default function ListPageHeader({
  title,
  timestamp,
  children,
}: ListPageHeaderProps) {
  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
      <Group gap="sm" align="baseline">
        <Title order={1}>{title}</Title>
        {timestamp != null && <LastUpdated timestamp={timestamp} />}
      </Group>
      {children}
    </Group>
  );
}
