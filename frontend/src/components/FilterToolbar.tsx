import { Badge, Button, Collapse, Group, Paper, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { IoFilter } from 'react-icons/io5';
import { IMAGE_SIZE } from '../constants/ui';
import type { ViewMode } from '../hooks/use-filters';
import ViewToggle from './ViewToggle';

interface FilterToolbarProps {
  count: number;
  noun: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCount: number;
  filterOpen: boolean;
  onFilterToggle: () => void;
  children: ReactNode;
}

export default function FilterToolbar({
  count,
  noun,
  viewMode,
  onViewModeChange,
  filterCount,
  filterOpen,
  onFilterToggle,
  children,
}: FilterToolbarProps) {
  return (
    <>
      <Group justify="space-between" align="center" wrap="wrap">
        <Text size="sm" c="dimmed">
          {count} {noun}
          {count !== 1 ? 's' : ''}
        </Text>
        <Group gap="xs">
          <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
          <Button
            variant="default"
            size="xs"
            leftSection={<IoFilter size={IMAGE_SIZE.ICON_MD} />}
            rightSection={
              filterCount > 0 ? (
                <Badge size="xs" circle variant="filled">
                  {filterCount}
                </Badge>
              ) : null
            }
            onClick={onFilterToggle}
          >
            Filters
          </Button>
        </Group>
      </Group>

      <Collapse in={filterOpen}>
        <Paper p="md" radius="md" withBorder bg="var(--mantine-color-body)">
          {children}
        </Paper>
      </Collapse>
    </>
  );
}
