import { Paper, Skeleton, Stack } from '@mantine/core';

export function ListPageLoading({ cards = 4 }: { cards?: number }) {
  return (
    <Stack gap="sm" py="xs">
      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          <Skeleton height={36} radius="md" />
          <Skeleton height={36} radius="md" />
        </Stack>
      </Paper>

      {Array.from({ length: cards }).map((_, index) => (
        <Paper key={index} p="md" radius="md" withBorder>
          <Stack gap="xs">
            <Skeleton height={18} width="40%" radius="sm" />
            <Skeleton height={14} width="90%" radius="sm" />
            <Skeleton height={14} width="75%" radius="sm" />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

export function DetailPageLoading() {
  return (
    <Stack gap="md" py="xl">
      <Paper p="lg" radius="md" withBorder>
        <Stack gap="sm">
          <Skeleton height={28} width="35%" radius="sm" />
          <Skeleton height={16} width="25%" radius="sm" />
          <Skeleton height={14} width="90%" radius="sm" />
        </Stack>
      </Paper>
      <Paper p="lg" radius="md" withBorder>
        <Stack gap="sm">
          <Skeleton height={18} width="30%" radius="sm" />
          <Skeleton height={120} radius="md" />
          <Skeleton height={120} radius="md" />
        </Stack>
      </Paper>
    </Stack>
  );
}
