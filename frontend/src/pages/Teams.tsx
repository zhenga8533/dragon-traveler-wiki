import { Title, Text, Container, Stack } from '@mantine/core';

export default function Teams() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Teams</Title>
        <Text c="dimmed">Team compositions will appear here once scraped.</Text>
      </Stack>
    </Container>
  );
}
