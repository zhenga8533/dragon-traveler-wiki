import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';
import ResourceBadge from './ResourceBadge';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: number | string;
  color: string;
  subtitle?: string;
  resourceName?: string;
}

export default function StatCard({
  icon,
  title,
  value,
  color,
  subtitle,
  resourceName,
}: StatCardProps) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap={6} align="center">
        <ThemeIcon variant="light" color={color} size="lg" radius="md">
          {icon}
        </ThemeIcon>
        <Text size="xs" c="dimmed" ta="center">
          {title}
        </Text>
        {resourceName ? (
          <Group gap="xs" justify="center">
            <ResourceBadge name={resourceName} size="md" />
          </Group>
        ) : (
          <Text size="xl" fw={700} ta="center">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
        )}
        {subtitle && (
          <Text size="xs" c="dimmed" ta="center">
            {subtitle}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
