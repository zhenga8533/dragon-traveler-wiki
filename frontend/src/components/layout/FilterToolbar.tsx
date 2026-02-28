import {
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { type ReactNode, useEffect, useRef } from 'react';
import { IoFilter } from 'react-icons/io5';
import { getCardHoverProps } from '../../constants/styles';
import { BREAKPOINTS, IMAGE_SIZE, Z_INDEX } from '../../constants/ui';
import type { ViewMode } from '../../hooks/use-filters';
import ViewToggle from '../common/ViewToggle';

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
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filterOpen && isMobile && filterPanelRef.current) {
      // Small delay to let the Collapse animation start before scrolling
      const id = setTimeout(() => {
        filterPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
      return () => clearTimeout(id);
    }
  }, [filterOpen, isMobile]);

  return (
    <>
      <Box
        style={
          isMobile
            ? {
                position: 'sticky',
                top: 'calc(60px + var(--mantine-spacing-xs))',
                zIndex: Z_INDEX.STICKY,
                padding: 'var(--mantine-spacing-xs)',
                borderRadius: 'var(--mantine-radius-md)',
                background: 'var(--mantine-color-body)',
                border: '1px solid var(--mantine-color-default-border)',
              }
            : undefined
        }
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text size="sm" c="dimmed">
            {count} {noun}
            {count !== 1 ? 's' : ''}
          </Text>
          <Group gap="xs">
            <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
            <Button
              variant="default"
              size={isMobile ? 'sm' : 'xs'}
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
      </Box>

      <Collapse in={filterOpen}>
        <Paper ref={filterPanelRef} p="sm" radius="md" withBorder {...getCardHoverProps()}>
          {children}
        </Paper>
      </Collapse>
    </>
  );
}
