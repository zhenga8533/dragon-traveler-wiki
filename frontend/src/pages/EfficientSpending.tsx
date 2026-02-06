import { Container, Stack, Text, Title } from '@mantine/core';

export default function EfficientSpending() {
  return (
    <Container size="xl">
      <Stack gap="md">
        <Title order={1}>Efficient Spending</Title>
        <Text c="dimmed">Guide to spending your resources wisely.</Text>
      </Stack>
    </Container>
  );
}
