import { Container, Stack, Text, Title } from '@mantine/core';

export default function Artifacts() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        <Title order={1}>Artifacts</Title>
        <Text c="dimmed">
          Artifact database is coming soon. Data and models will be added later.
        </Text>
      </Stack>
    </Container>
  );
}
