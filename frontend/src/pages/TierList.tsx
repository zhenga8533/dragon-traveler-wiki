import { Title, Text, Container, Stack } from '@mantine/core';

export default function TierList() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Tier List</Title>
        <Text c="dimmed">Tier list rankings will appear here once scraped.</Text>
      </Stack>
    </Container>
  );
}
