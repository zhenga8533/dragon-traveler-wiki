import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';
import ResourceBadge from './ResourceBadge';

interface StatCardProps {
  icon?: ReactNode;
  title: string;
  value: number | string;
  color: string;
  subtitle?: string;
  resourceName?: string;
  showIcon?: boolean;
  showTitle?: boolean;
  showResourceQuantity?: boolean;
}

export default function StatCard({
  icon,
  title,
  value,
  color,
  subtitle,
  resourceName,
  showIcon = true,
  showTitle = true,
  showResourceQuantity = true,
}: StatCardProps) {
  const numericValue =
    typeof value === 'number' ? value : Number.parseFloat(value);
  const quantity = Number.isFinite(numericValue) ? numericValue : undefined;
  const displayValue =
    typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="xs" align="center" justify="center" h="100%">
        {showIcon && icon ? (
          <ThemeIcon variant="light" color={color} size="lg" radius="md">
            {icon}
          </ThemeIcon>
        ) : null}
        {showTitle ? (
          <Text size="xs" c="dimmed" ta="center">
            {title}
          </Text>
        ) : null}
        <Text size="xl" fw={700} ta="center" lh={1.2}>
          {displayValue}
        </Text>
        {resourceName ? (
          <Group gap="xs" justify="center" wrap="wrap">
            <ResourceBadge
              name={resourceName}
              quantity={showResourceQuantity ? quantity : undefined}
              size="sm"
            />
          </Group>
        ) : null}
        {subtitle && (
          <Text size="xs" c="dimmed" ta="center">
            {subtitle}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
