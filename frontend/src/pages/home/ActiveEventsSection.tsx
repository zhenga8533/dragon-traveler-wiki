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
import { getEventImage, placeholderEventImage } from '../../assets/event';
import CharacterPortrait from '../../components/character/CharacterPortrait';
import GlobalBadge from '../../components/common/GlobalBadge';
import TwEventBanner from '../../components/common/TwEventBanner';
import { getCardHoverProps } from '../../constants/styles';
import { IMAGE_SIZE } from '../../constants/ui';
import { useDataFetch, useGradientAccent } from '../../hooks';
import type { GameEvent, TwEvent } from '../../types';
import { getTwEventTypeColor, isTwEventActive } from '../../utils/event-utils';

type HomeEventEntry =
  | {
      kind: 'global';
      id: string;
      name: string;
      label: string | null;
      labelColor: string;
      description: string;
      startDate: string | null;
      image: string;
      characters: string[];
    }
  | {
      kind: 'tw';
      id: string;
      name: string;
      label: string;
      labelColor: string;
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
        label: event.badge ?? null,
        labelColor: accent.primary,
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
        label: event.type,
        labelColor: getTwEventTypeColor(event.type),
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
                  {event.label && (
                    <Badge
                      size="xs"
                      variant="light"
                      color={event.labelColor}
                      radius="sm"
                    >
                      {event.label}
                    </Badge>
                  )}
                </Group>
                <Text size="sm" fw={600} lineClamp={2}>
                  {event.name}
                </Text>
                {event.kind === 'tw' && event.characters.length > 0 && (
                  <Group gap={4} wrap="wrap">
                    {event.characters.map((character) => (
                      <CharacterPortrait
                        key={character}
                        name={character}
                        size={IMAGE_SIZE.PORTRAIT_SM}
                        link
                        tooltip={character}
                        loading="lazy"
                      />
                    ))}
                  </Group>
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
