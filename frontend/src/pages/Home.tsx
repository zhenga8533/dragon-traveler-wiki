import { Title, Text, Container, Stack } from '@mantine/core';

export default function Home() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Dragon Traveler Wiki</Title>
        <Text size="lg">
          A community-driven wiki for Dragon Traveler. Browse characters, tier
          lists, items, and the latest news.
        </Text>
      </Stack>
    </Container>
  );
}
