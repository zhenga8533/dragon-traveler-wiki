import { Drawer, type DrawerProps } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';

interface MobileBottomDrawerProps extends Omit<DrawerProps, 'position'> {
  children: ReactNode;
  /** Merged into the default body styles — use to override e.g. overflowY */
  bodyStyle?: CSSProperties;
}

const MOBILE_DRAWER_TOP_PADDING = 'var(--mantine-spacing-xs)';
const MOBILE_DRAWER_BOTTOM_PADDING =
  'max(var(--mantine-spacing-lg), env(safe-area-inset-bottom))';

export default function MobileBottomDrawer({
  children,
  bodyStyle,
  ...props
}: MobileBottomDrawerProps) {
  return (
    <Drawer
      position="bottom"
      padding="md"
      radius="md"
      size="90dvh"
      closeOnEscape
      withCloseButton
      styles={{
        content: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90dvh',
        },
        body: {
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingTop: MOBILE_DRAWER_TOP_PADDING,
          paddingBottom: MOBILE_DRAWER_BOTTOM_PADDING,
          scrollPaddingTop: MOBILE_DRAWER_TOP_PADDING,
          ...bodyStyle,
        },
      }}
      {...props}
    >
      {children}
    </Drawer>
  );
}
