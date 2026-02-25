import { Alert, Button, Group, Text } from '@mantine/core';
import { IoAlertCircleOutline, IoRefresh } from 'react-icons/io5';

interface DataFetchErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function DataFetchError({
  title = 'Failed to load data',
  message,
  onRetry,
}: DataFetchErrorProps) {
  return (
    <Alert
      variant="light"
      color="red"
      radius="md"
      title={title}
      icon={<IoAlertCircleOutline size={18} />}
    >
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Text size="sm" c="dimmed">
          {message ||
            'Something went wrong while loading this page. Please try again.'}
        </Text>
        {onRetry && (
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IoRefresh size={14} />}
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </Group>
    </Alert>
  );
}
