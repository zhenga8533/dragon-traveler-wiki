import { Title, Text, Container, Stack } from '@mantine/core';

export default function DragonSpells() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Dragon Spells</Title>
        <Text c="dimmed">Dragon spell data will appear here once scraped.</Text>
      </Stack>
    </Container>
  );
}
