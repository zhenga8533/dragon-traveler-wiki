import { Container, Stack, Text, Title } from '@mantine/core';

export default function StarUpgradeCalculator() {
  return (
    <Container size="xl">
      <Stack gap="md">
        <Title order={1}>Star Upgrade Calculator</Title>
        <Text c="dimmed">
          Calculate resources needed for character star upgrades.
        </Text>
      </Stack>
    </Container>
  );
}
