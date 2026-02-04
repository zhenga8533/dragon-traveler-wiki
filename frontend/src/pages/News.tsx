import { Title, Text, Container, Stack } from '@mantine/core';

export default function News() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>News</Title>
        <Text c="dimmed">Latest news and updates will appear here once scraped.</Text>
      </Stack>
    </Container>
  );
}
