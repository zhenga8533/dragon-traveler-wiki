import {
  Badge,
  Box,
  Button,
  Group,
  Popover,
  Text,
} from '@mantine/core';
import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer';
import { type ReactNode } from 'react';
import { IoFilter } from 'react-icons/io5';
import { HEADER_HEIGHT, IMAGE_SIZE, Z_INDEX } from '@/constants/ui';
import { useGradientAccent, useIsMobile } from '@/hooks';
import type { ViewMode } from '@/hooks/use-filters';
import ViewToggle from '@/components/ui/ViewToggle';

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
  const isMobile = useIsMobile();
  const { accent } = useGradientAccent();

  const filterButton = (
    <Button
      variant="default"
      color={accent.primary}
      size={isMobile ? 'sm' : 'xs'}
      leftSection={<IoFilter size={IMAGE_SIZE.ICON_MD} />}
      rightSection={
        filterCount > 0 ? (
          <Badge size="xs" circle variant="filled" color={accent.primary}>
            {filterCount}
          </Badge>
        ) : null
      }
      onClick={onFilterToggle}
    >
      Filters
    </Button>
  );

  return (
    <>
      <Box
        style={
          isMobile
            ? {
                position: 'sticky',
                top: `calc(${HEADER_HEIGHT.MOBILE}px + var(--mantine-spacing-xs))`,
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
            {isMobile ? (
              filterButton
            ) : (
              <Popover
                opened={filterOpen}
                onDismiss={onFilterToggle}
                width={480}
                position="bottom-end"
                withArrow
                offset={8}
                shadow="md"
                closeOnClickOutside
              >
                <Popover.Target>{filterButton}</Popover.Target>
                <Popover.Dropdown
                  p="sm"
                  style={{
                    maxHeight: '70dvh',
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                  }}
                >
                  {children}
                </Popover.Dropdown>
              </Popover>
            )}
          </Group>
        </Group>
      </Box>

      {isMobile && (
        <MobileBottomDrawer
          opened={filterOpen}
          onClose={onFilterToggle}
          title="Filters"
          closeButtonProps={{ 'aria-label': 'Close filters' }}
        >
          {children}
        </MobileBottomDrawer>
      )}
    </>
  );
}
