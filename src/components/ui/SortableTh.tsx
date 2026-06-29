import { Group, Table } from '@mantine/core';
import type { KeyboardEvent } from 'react';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';

interface SortableThProps {
  children: React.ReactNode;
  sortKey: string;
  sortCol: string | null;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export default function SortableTh({
  children,
  sortKey,
  sortCol,
  sortDir,
  onSort,
}: SortableThProps) {
  const active = sortCol === sortKey;
  const Icon = active && sortDir === 'desc' ? IoChevronDown : IoChevronUp;
  const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';

  const handleKeyDown = (e: KeyboardEvent<HTMLTableCellElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort(sortKey);
    }
  };

  return (
    <Table.Th
      onClick={() => onSort(sortKey)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-sort={ariaSort}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        color: active ? 'var(--mantine-primary-color-filled)' : undefined,
      }}
    >
      <Group gap={4} wrap="nowrap">
        <span>{children}</span>
        <Icon size={11} style={{ flexShrink: 0, opacity: active ? 1 : 0.25 }} />
      </Group>
    </Table.Th>
  );
}
