import { Drawer, type DrawerProps } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';

interface MobileBottomDrawerProps extends Omit<DrawerProps, 'position'> {
  children: ReactNode;
  /** Merged into the default body styles — use to override e.g. overflowY */
  bodyStyle?: CSSProperties;
}

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
      size="85%"
      closeOnEscape
      withCloseButton
      styles={{
        body: {
          maxHeight: '75dvh',
          overflowY: 'auto',
          paddingBottom:
            'max(var(--mantine-spacing-lg), env(safe-area-inset-bottom))',
          ...bodyStyle,
        },
      }}
      {...props}
    >
      {children}
    </Drawer>
  );
}
