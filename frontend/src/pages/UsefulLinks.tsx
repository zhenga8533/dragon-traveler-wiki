import { Title, Text, Container, Stack } from '@mantine/core';

export default function UsefulLinks() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Useful Links</Title>
        <Text c="dimmed">Useful links and resources will appear here.</Text>
      </Stack>
    </Container>
  );
}
