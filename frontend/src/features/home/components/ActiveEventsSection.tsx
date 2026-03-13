import { getEventImage, placeholderEventImage } from '@/assets/event';
import { getCardHoverProps } from '@/constants/styles';
import GlobalBadge from '@/features/teams/components/GlobalBadge';
import EventCharacterAvatars from '@/features/wiki/components/EventCharacterAvatars';
import TwEventBanner from '@/features/wiki/components/TwEventBanner';
import { useDataFetch, useGradientAccent } from '@/hooks';
import type { GameEvent } from '@/types';
import { getEventTypeColor, isGameEventActive } from '@/utils/event-utils';
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
import { useMemo } from 'react';

export default function ActiveEventsSection() {
  const { accent } = useGradientAccent();
  const { data: events, loading } = useDataFetch<GameEvent[]>(
    'data/events.json',
    []
  );

  const activeEvents = useMemo<GameEvent[]>(() => {
    return events
      .filter(isGameEventActive)
      .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))
      .slice(0, 3);
  }, [events]);

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
          const id =
            event.event_id ??
            (event.is_global
              ? `global:${event.name}`
              : `tw:${event.name}:${event.start_date}`);
          const image = getEventImage(event.name) ?? placeholderEventImage;
          const typeColor = event.is_global
            ? accent.primary
            : getEventTypeColor(event.type);
          return (
            <Card
              key={id}
              padding={0}
              radius="md"
              withBorder
              {...getCardHoverProps()}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <Card.Section>
                {!event.is_global ? (
                  <TwEventBanner
                    characters={event.characters}
                    height={130}
                    radius="0"
                    alt={event.name}
                  />
                ) : (
                  <Image
                    src={image}
                    height={130}
                    fit="cover"
                    alt={event.name}
                    style={{ objectPosition: 'top' }}
                  />
                )}
              </Card.Section>
              <Stack gap="xs" p="md" style={{ flex: 1 }}>
                <Group gap="xs" wrap="wrap">
                  <GlobalBadge isGlobal={event.is_global} size="sm" />
                  {event.type && (
                    <Badge
                      size="xs"
                      variant="light"
                      color={typeColor}
                      radius="sm"
                    >
                      {event.type}
                    </Badge>
                  )}
                </Group>
                <Text size="sm" fw={600} lineClamp={2}>
                  {event.name}
                </Text>
                {event.characters.length > 0 && (
                  <EventCharacterAvatars characters={event.characters} />
                )}
                {event.description && (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {event.description}
                  </Text>
                )}
                {event.start_date && (
                  <Text size="xs" c="dimmed" mt="auto">
                    Started: {event.start_date}
                  </Text>
                )}
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
