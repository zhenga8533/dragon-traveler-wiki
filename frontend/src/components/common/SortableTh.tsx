import { Group, Table } from '@mantine/core';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
  CURSOR_POINTER_STYLE,
  FLEX_SHRINK_0_STYLE,
} from '../../constants/styles';

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

  return (
    <Table.Th
      onClick={() => onSort(sortKey)}
      style={{
        ...CURSOR_POINTER_STYLE,
        userSelect: 'none',
        color: active ? 'var(--mantine-color-blue-filled)' : undefined,
      }}
    >
      <Group gap={4} wrap="nowrap">
        <span>{children}</span>
        <Icon
          size={11}
          style={{ ...FLEX_SHRINK_0_STYLE, opacity: active ? 1 : 0.25 }}
        />
      </Group>
    </Table.Th>
  );
}
