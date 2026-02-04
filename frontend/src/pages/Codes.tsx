import { Title, Text, Container, Stack } from '@mantine/core';

export default function Codes() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Codes</Title>
        <Text c="dimmed">Redemption codes will appear here once scraped.</Text>
      </Stack>
    </Container>
  );
}
