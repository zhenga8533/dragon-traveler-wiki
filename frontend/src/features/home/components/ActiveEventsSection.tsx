import { getEventImage, placeholderEventImage } from '@/assets/event';
import { getCardHoverProps } from '@/constants/styles';
import GlobalBadge from '@/features/teams/components/GlobalBadge';
import EventCharacterAvatars from '@/features/wiki/components/EventCharacterAvatars';
import TwEventBanner from '@/features/wiki/components/TwEventBanner';
import { useDataFetch, useGradientAccent } from '@/hooks';
import type { GameEvent, TwEvent } from '@/types';
import { getTwEventTypeColor, isTwEventActive } from '@/utils/event-utils';
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

type HomeEventEntry =
  | {
      kind: 'global';
      id: string;
      name: string;
      tag: string | null;
      tagColor: string;
      description: string;
      startDate: string | null;
      image: string;
      characters: string[];
    }
  | {
      kind: 'tw';
      id: string;
      name: string;
      tag: string;
      tagColor: string;
      description: string;
      startDate: string | null;
      characters: string[];
    };

export default function ActiveEventsSection() {
  const { accent } = useGradientAccent();
  const { data: events, loading: loadingEvents } = useDataFetch<GameEvent[]>(
    'data/events.json',
    []
  );
  const { data: twEvents, loading: loadingTwEvents } = useDataFetch<TwEvent[]>(
    'data/events_tw.json',
    []
  );

  const activeEvents = useMemo<HomeEventEntry[]>(() => {
    const globalEvents: HomeEventEntry[] = events
      .filter((event) => event.active)
      .map((event) => ({
        kind: 'global',
        id: event.event_id ?? `global:${event.name}`,
        name: event.name,
        tag: event.tag ?? null,
        tagColor: accent.primary,
        description: event.description ?? '',
        startDate: event.start_date ?? null,
        image: getEventImage(event.name) ?? placeholderEventImage,
        characters: [],
      }));

    const taiwanEvents: HomeEventEntry[] = twEvents
      .filter(isTwEventActive)
      .map((event) => ({
        kind: 'tw',
        id: `tw:${event.name}:${event.start_date}`,
        name: event.name,
        tag: event.type,
        tagColor: getTwEventTypeColor(event.type),
        description: '',
        startDate: event.start_date ?? null,
        characters: event.characters,
      }));

    return [...globalEvents, ...taiwanEvents]
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
      .slice(0, 3);
  }, [accent.primary, events, twEvents]);

  const loading = loadingEvents || loadingTwEvents;

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
          return (
            <Card
              key={event.id}
              padding={0}
              radius="md"
              withBorder
              {...getCardHoverProps()}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <Card.Section>
                {event.kind === 'tw' ? (
                  <TwEventBanner
                    characters={event.characters}
                    height={130}
                    radius="0"
                    alt={event.name}
                  />
                ) : (
                  <Image
                    src={event.image}
                    height={130}
                    fit="cover"
                    alt={event.name}
                    style={{ objectPosition: 'top' }}
                  />
                )}
              </Card.Section>
              <Stack gap="xs" p="md" style={{ flex: 1 }}>
                <Group gap="xs" wrap="wrap">
                  <GlobalBadge isGlobal={event.kind === 'global'} size="sm" />
                  {event.tag && (
                    <Badge
                      size="xs"
                      variant="light"
                      color={event.tagColor}
                      radius="sm"
                    >
                      {event.tag}
                    </Badge>
                  )}
                </Group>
                <Text size="sm" fw={600} lineClamp={2}>
                  {event.name}
                </Text>
                {event.kind === 'tw' && (
                  <EventCharacterAvatars characters={event.characters} />
                )}
                {event.description && (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {event.description}
                  </Text>
                )}
                {event.startDate && (
                  <Text size="xs" c="dimmed" mt="auto">
                    Started: {event.startDate}
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
