import { Box, Stack, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';
import { IoSearch } from 'react-icons/io5';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Box py="xl">
      <Stack align="center" gap="md">
        <ThemeIcon
          size={64}
          radius="xl"
          variant="light"
          color="gray"
        >
          {icon || <IoSearch size={32} />}
        </ThemeIcon>
        <Stack align="center" gap={4}>
          <Text fw={500} size="lg" ta="center">
            {title}
          </Text>
          {description && (
            <Text size="sm" c="dimmed" ta="center" maw={300}>
              {description}
            </Text>
          )}
        </Stack>
        {action}
      </Stack>
    </Box>
  );
}
