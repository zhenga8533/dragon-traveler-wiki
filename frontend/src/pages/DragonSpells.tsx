import { Container, Stack, Text, Title } from '@mantine/core';

export default function DragonSpells() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Wyrmspells</Title>
        <Text c="dimmed">Wyrmspell data will appear here once scraped.</Text>
      </Stack>
    </Container>
  );
}
