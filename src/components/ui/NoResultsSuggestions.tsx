import { Button, Group, Stack, Text } from '@mantine/core';
import { useGradientAccent } from '@/hooks';
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
  const { accent } = useGradientAccent();

  return (
    <EmptyState
      title={title}
      description={message}
      color={accent.primary}
      action={
        <Stack align="center" gap="xs">
          <Text size="xs" c="dimmed" ta="center">
            Tip: try clearing search terms, resetting filters, or broadening
            selections.
          </Text>
          <Group gap="xs" justify="center" wrap="wrap">
            {onReset && (
              <Button
                size="xs"
                variant="light"
                color={accent.primary}
                onClick={onReset}
              >
                {resetLabel}
              </Button>
            )}
            {onOpenFilters && (
              <Button
                size="xs"
                variant="outline"
                color={accent.primary}
                onClick={onOpenFilters}
              >
                Open filters
              </Button>
            )}
          </Group>
        </Stack>
      }
    />
  );
}
