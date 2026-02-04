import { Title, Text, Container, Stack } from '@mantine/core';

export default function Characters() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Characters</Title>
        <Text c="dimmed">Character data will appear here once scraped.</Text>
      </Stack>
    </Container>
  );
}
