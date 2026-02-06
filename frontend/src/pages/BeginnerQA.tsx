import { Container, Stack, Text, Title } from '@mantine/core';

export default function BeginnerQA() {
  return (
    <Container size="xl">
      <Stack gap="md">
        <Title order={1}>Beginner Q&amp;A</Title>
        <Text c="dimmed">Common questions and answers for new players.</Text>
      </Stack>
    </Container>
  );
}
