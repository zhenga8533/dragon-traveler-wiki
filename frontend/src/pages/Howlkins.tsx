import { Container, Stack, Text, Title } from '@mantine/core';

export default function Howlkins() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        <Title order={1}>Howlkins</Title>
        <Text c="dimmed">
          Howlkin database is coming soon. Data and models will be added later.
        </Text>
      </Stack>
    </Container>
  );
}
