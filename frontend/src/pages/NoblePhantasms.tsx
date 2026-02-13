import { Container, Stack, Text, Title } from '@mantine/core';

export default function NoblePhantasms() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        <Title order={1}>Noble Phantasms</Title>
        <Text c="dimmed">
          Noble Phantasm database is coming soon. Data and models will be added
          later.
        </Text>
      </Stack>
    </Container>
  );
}
