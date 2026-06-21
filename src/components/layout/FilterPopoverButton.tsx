import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer';
import { IMAGE_SIZE } from '@/constants/ui';
import { useGradientAccent, useIsMobile } from '@/hooks';
import { ActionIcon, Badge, Button, Indicator, Popover, Tooltip } from '@mantine/core';
import { useId, type ReactNode } from 'react';
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
  const panelId = useId();
  const handleClose = () => {
    if (filterOpen) onFilterToggle();
  };

  const disclosureProps = children
    ? {
        'aria-controls': panelId,
        'aria-expanded': filterOpen,
        'aria-haspopup': 'dialog' as const,
      }
    : {};

  const filterButton = isMobile ? (
    <Tooltip label={buttonLabel}>
      <Indicator
        disabled={filterCount === 0}
        label={filterCount}
        size={16}
        color={accent.primary}
      >
        <ActionIcon
          variant="default"
          color={accent.primary}
          size="lg"
          onClick={onFilterToggle}
          aria-label={buttonLabel}
          {...disclosureProps}
        >
          <IoFilter size={IMAGE_SIZE.ICON_MD} />
        </ActionIcon>
      </Indicator>
    </Tooltip>
  ) : (
    <Button
      variant="default"
      color={accent.primary}
      size="xs"
      leftSection={<IoFilter size={IMAGE_SIZE.ICON_MD} />}
      rightSection={
        filterCount > 0 ? (
          <Badge size="xs" circle variant="filled" color={accent.primary}>
            {filterCount}
          </Badge>
        ) : null
      }
      onClick={onFilterToggle}
      {...disclosureProps}
    >
      {buttonLabel}
    </Button>
  );

  return (
    <>
      {children && !isMobile ? (
        <Popover
          opened={filterOpen}
          onDismiss={handleClose}
          width={480}
          position="bottom-end"
          withArrow
          offset={8}
          shadow="md"
          closeOnClickOutside
        >
          <Popover.Target>{filterButton}</Popover.Target>
          <Popover.Dropdown
            id={panelId}
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
          id={panelId}
          opened={filterOpen}
          onClose={handleClose}
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
