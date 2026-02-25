import { Badge, Group, Text } from '@mantine/core';

interface HowlkinStatsProps {
  stats: Record<string, number | string> | null | undefined;
  size?: 'xs' | 'sm';
}

function formatValue(value: number | string): string {
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    });
  }
  return String(value);
}

export default function HowlkinStats({ stats, size = 'sm' }: HowlkinStatsProps) {
  const entries = Object.entries(stats ?? {}).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    if (size === 'xs') return null;
    return (
      <Text size="xs" c="dimmed">
        No stats listed.
      </Text>
    );
  }

  return (
    <Group gap={size === 'xs' ? 4 : 6} wrap="wrap">
      {entries.map(([stat, value]) => (
        <Badge key={stat} variant="light" size={size} color="blue">
          {stat}: {formatValue(value)}
        </Badge>
      ))}
    </Group>
  );
}
