import { Text } from '@mantine/core';

function formatRelativeTime(unixSeconds: number): string {
  if (!unixSeconds) return '';

  const diffMs = Date.now() - unixSeconds * 1000;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

export default function LastUpdated({ timestamp }: { timestamp: number }) {
  const formatted = formatRelativeTime(timestamp);
  if (!formatted) return null;

  return (
    <Text size="xs" c="dimmed">
      Updated {formatted}
    </Text>
  );
}
