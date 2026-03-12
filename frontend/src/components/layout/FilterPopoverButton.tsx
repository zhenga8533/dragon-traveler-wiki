import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer';
import { IMAGE_SIZE } from '@/constants/ui';
import { useGradientAccent, useIsMobile } from '@/hooks';
import { Badge, Button, Popover } from '@mantine/core';
import { type ReactNode } from 'react';
import { IoFilter } from 'react-icons/io5';

interface FilterPopoverButtonProps {
  filterCount: number;
  filterOpen: boolean;
  onFilterToggle: () => void;
  buttonLabel?: string;
  children?: ReactNode;
}

export default function FilterPopoverButton({
  filterCount,
  filterOpen,
  onFilterToggle,
  buttonLabel = 'Filters',
  children,
}: FilterPopoverButtonProps) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();

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
      {buttonLabel}
    </Button>
  );

  return (
    <>
      {children && !isMobile ? (
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
      ) : (
        filterButton
      )}

      {isMobile && children && (
        <MobileBottomDrawer
          opened={filterOpen}
          onClose={onFilterToggle}
          title={buttonLabel}
          closeButtonProps={{
            'aria-label': `Close ${buttonLabel.toLowerCase()}`,
          }}
        >
          {children}
        </MobileBottomDrawer>
      )}
    </>
  );
}
