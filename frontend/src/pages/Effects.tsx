import { Title, Text, Container, Stack } from '@mantine/core';

export default function Effects() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Effects</Title>
        <Text c="dimmed">Effect data will appear here once scraped.</Text>
      </Stack>
    </Container>
  );
}
