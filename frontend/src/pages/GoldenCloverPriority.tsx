import { Container, Stack, Text, Title } from '@mantine/core';

export default function GoldenCloverPriority() {
  return (
    <Container size="xl">
      <Stack gap="md">
        <Title order={1}>Golden Clover Priority</Title>
        <Text c="dimmed">Prioritization guide for golden clover usage.</Text>
      </Stack>
    </Container>
  );
}
