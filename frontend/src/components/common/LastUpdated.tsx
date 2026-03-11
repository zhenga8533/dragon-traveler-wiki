import { Text, Tooltip } from '@mantine/core';
import { formatExactDate, formatRelativeTime } from '@/utils';

export default function LastUpdated({ timestamp }: { timestamp: number }) {
  const formatted = formatRelativeTime(timestamp);
  if (!formatted) return null;

  return (
    <Tooltip label={formatExactDate(timestamp)} position="top" withArrow>
      <Text size="xs" c="dimmed" w="fit-content">
        Updated {formatted}
      </Text>
    </Tooltip>
  );
}
