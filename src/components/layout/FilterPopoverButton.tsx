import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer';
import { IMAGE_SIZE } from '@/constants/ui';
import { useGradientAccent, useIsMobile } from '@/hooks';
import { ActionIcon, Badge, Button, Indicator, Popover, Tooltip } from '@mantine/core';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IoFilter } from 'react-icons/io5';

interface FilterPopoverButtonProps {
  filterCount: number;
  filterOpen: boolean;
  onFilterToggle: () => void;
  buttonLabel?: string;
  children?: ReactNode;
}

// Only the button's own scrollable ancestors (plus the window) — never the dropdown's
// internal scroll container, which isn't one of the button's ancestors. `scroll` events
// don't bubble, so this can't fire from scrolling inside the open filter panel.
function getScrollableAncestors(el: HTMLElement | null): (HTMLElement | Window)[] {
  const result: (HTMLElement | Window)[] = [window];
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
      result.push(node);
    }
    node = node.parentElement;
  }
  return result;
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
  const targetRef = useRef<HTMLButtonElement>(null);
  const handleClose = () => {
    if (filterOpen) onFilterToggle();
  };

  useEffect(() => {
    if (!filterOpen || isMobile) return;
    const scrollTargets = getScrollableAncestors(targetRef.current);
    const onScroll = () => handleClose();
    scrollTargets.forEach((el) =>
      el.addEventListener('scroll', onScroll, { passive: true })
    );
    return () => {
      scrollTargets.forEach((el) => el.removeEventListener('scroll', onScroll));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOpen, isMobile]);

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
      ref={targetRef}
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
          // Bound against the document instead of the narrow scrollable pool column
          // the button can sit in, and clamp height to whatever space is available.
          middlewares={{
            shift: { boundary: document.body },
            flip: { boundary: document.body },
            size: { boundary: document.body, padding: 8 },
          }}
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
