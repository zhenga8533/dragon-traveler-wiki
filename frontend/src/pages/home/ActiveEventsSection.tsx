import {
  Badge,
  Card,
  Group,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { getEventImage } from '../../assets/event';
import { getCardHoverProps } from '../../constants/styles';
import { useDataFetch, useGradientAccent } from '../../hooks';
import type { GameEvent } from '../../types/event';

export default function ActiveEventsSection() {
  const { accent } = useGradientAccent();
  const { data: events, loading } = useDataFetch<GameEvent[]>(
    'data/events.json',
    []
  );
  const activeEvents = events.filter((e) => e.active).slice(0, 3);

  if (loading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={180} radius="md" />
        ))}
      </SimpleGrid>
    );
  }

  if (activeEvents.length === 0) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No active events at the moment.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <SimpleGrid
        cols={{
          base: 1,
          sm: activeEvents.length > 1 ? 2 : 1,
          md: activeEvents.length,
        }}
        spacing="sm"
      >
        {activeEvents.map((event) => {
          const image = getEventImage(event.name);
          return (
            <Card
              key={event.event_id ?? event.name}
              padding={0}
              radius="md"
              withBorder
              {...getCardHoverProps()}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <Card.Section>
                <Image
                  src={image}
                  height={130}
                  fit="cover"
                  alt={event.name}
                  style={{ objectPosition: 'top' }}
                />
              </Card.Section>
              <Stack gap={4} p="sm" style={{ flex: 1 }}>
                {event.badge && (
                  <Badge
                    size="xs"
                    variant="light"
                    color={accent.primary}
                    radius="sm"
                    w="fit-content"
                  >
                    {event.badge}
                  </Badge>
                )}
                <Text size="sm" fw={600} lineClamp={2}>
                  {event.name}
                </Text>
                {event.description && (
                  <Text size="xs" c="dimmed">
                    {event.description}
                  </Text>
                )}
                {event.start_date && (
                  <Group gap={4} mt="auto">
                    <Text size="xs" c="dimmed">
                      Since {event.start_date}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
