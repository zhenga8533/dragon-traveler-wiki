import { Badge, Button, Group, Popover } from '@mantine/core';
import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer';
import { type ReactNode } from 'react';
import { IoFilter } from 'react-icons/io5';
import { useGradientAccent, useIsMobile } from '@/hooks';
import type { ViewMode } from '@/hooks/use-filters';
import ViewToggle from '@/components/ui/ViewToggle';

interface PageFilterHeaderControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCount: number;
  filterOpen?: boolean;
  onFilterToggle: () => void;
  buttonLabel?: string;
  children?: ReactNode;
}

export default function PageFilterHeaderControls({
  viewMode,
  onViewModeChange,
  filterCount,
  filterOpen = false,
  onFilterToggle,
  buttonLabel = 'Filters',
  children,
}: PageFilterHeaderControlsProps) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();

  const filterButton = (
    <Button
      variant="default"
      color={accent.primary}
      size={isMobile ? 'sm' : 'xs'}
      leftSection={<IoFilter size={16} />}
      rightSection={
        filterCount > 0 ? (
          <Badge size="xs" circle variant="filled" color={accent.primary}>
            {filterCount}
          </Badge>
        ) : null
      }
      onClick={onFilterToggle}
    >
      {buttonLabel}
    </Button>
  );

  return (
    <>
      <Group gap="xs">
        <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
        {!children || isMobile ? (
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

      {isMobile && children && (
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
