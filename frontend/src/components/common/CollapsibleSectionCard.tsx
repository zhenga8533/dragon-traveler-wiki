import { Box, Collapse, Group, Paper, UnstyledButton } from '@mantine/core';
import { useCallback, useState, type ReactNode } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import { getCardHoverProps } from '../../constants/styles';

interface CollapsibleSectionCardProps {
  header: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  id?: string;
}

export default function CollapsibleSectionCard({
  header,
  children,
  defaultExpanded = true,
  id,
}: CollapsibleSectionCardProps) {
  const [opened, setOpened] = useState(defaultExpanded);
  const toggle = useCallback(() => setOpened((v) => !v), []);

  return (
    <Paper id={id} p="lg" radius="md" withBorder {...getCardHoverProps()}>
      <UnstyledButton
        onClick={toggle}
        style={{
          width: '100%',
          minHeight: 44,
          paddingBlock: 4,
          borderRadius: 'var(--mantine-radius-sm)',
        }}
        aria-expanded={opened}
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Box style={{ flex: 1, minWidth: 0 }}>{header}</Box>
          <Box
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              transition: 'transform 150ms ease',
              transform: opened ? 'rotate(180deg)' : 'rotate(0deg)',
              color: 'var(--mantine-color-dimmed)',
            }}
          >
            <IoChevronDown size={18} />
          </Box>
        </Group>
      </UnstyledButton>

      <Collapse in={opened}>
        <Box pt="md">{children}</Box>
      </Collapse>
    </Paper>
  );
}
