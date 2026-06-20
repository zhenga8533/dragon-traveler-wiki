import { Table, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EntityTableLinkCellProps {
  to: string;
  children: ReactNode;
  fontWeight?: number;
}

/** Consistent, keyboard-accessible primary link for entity table rows. */
export default function EntityTableLinkCell({
  to,
  children,
  fontWeight = 600,
}: EntityTableLinkCellProps) {
  return (
    <Table.Td>
      <Text
        component={Link}
        to={to}
        size="sm"
        fw={fontWeight}
        className="dt-link-text"
        style={{ textDecoration: 'none' }}
      >
        {children}
      </Text>
    </Table.Td>
  );
}
