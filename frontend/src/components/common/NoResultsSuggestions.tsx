import { Button, Group, Stack, Text } from '@mantine/core';
import EmptyState from './EmptyState';

interface NoResultsSuggestionsProps {
  title?: string;
  message: string;
  onReset?: () => void;
  onOpenFilters?: () => void;
  resetLabel?: string;
}

export default function NoResultsSuggestions({
  title = 'No results found',
  message,
  onReset,
  onOpenFilters,
  resetLabel = 'Reset filters',
}: NoResultsSuggestionsProps) {
  return (
    <EmptyState
      title={title}
      description={message}
      action={
        <Stack align="center" gap="xs">
          <Text size="xs" c="dimmed" ta="center">
            Tip: try clearing search terms, resetting filters, or broadening
            selections.
          </Text>
          <Group gap="xs" justify="center" wrap="wrap">
            {onReset && (
              <Button size="xs" variant="light" onClick={onReset}>
                {resetLabel}
              </Button>
            )}
            {onOpenFilters && (
              <Button size="xs" variant="default" onClick={onOpenFilters}>
                Open filters
              </Button>
            )}
          </Group>
        </Stack>
      }
    />
  );
}
