import {
  Alert,
  Badge,
  Box,
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import {
  IoCalendar,
  IoCalendarOutline,
  IoGlobeOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5';
import { getIllustrations } from '../assets/character';
import { getEventImage, placeholderEventImage } from '../assets/event';
import CharacterPortrait from '../components/character/CharacterPortrait';
import DataFetchError from '../components/common/DataFetchError';
import EmptyState from '../components/common/EmptyState';
import LastUpdated from '../components/common/LastUpdated';
import PaginationControl from '../components/common/PaginationControl';
import { getCardHoverProps } from '../constants/styles';
import { IMAGE_SIZE } from '../constants/ui';
import {
  useDataFetch,
  useGradientAccent,
  usePagination,
  useTabParam,
} from '../hooks';
import type { GameEvent, TwEvent } from '../types';
import { getLatestTimestamp } from '../utils';

const EVENTS_PER_PAGE = 12;

type TabFilter = 'active' | 'past' | 'tw';

const TW_TYPE_COLOR: Record<string, string> = {
  Release: 'blue',
  Skin: 'teal',
  'Mythic Ascension': 'violet',
  Rerun: 'gray',
};

function isTwEventActive(event: TwEvent): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (!event.start_date || !event.end_date) return false;
  if (event.start_date.length < 10 || event.end_date.length < 10) return false;
  return event.start_date <= today && event.end_date >= today;
}

interface TwIllustrationState {
  src: string | null;
  idx: number;
  total: number;
  goTo: (i: number) => void;
}

function useTwIllustration(characters: string[]): TwIllustrationState {
  const [srcs, setSrcs] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const charKey = characters.join(',');

  useEffect(() => {
    let cancelled = false;
    setSrcs([]);
    setIdx(0);
    Promise.all(
      characters.map(async (char) => {
        const list = await getIllustrations(char);
        const img =
          list.find((il) => il.type === 'image' && il.name.toLowerCase() === 'default') ??
          list.find((il) => il.type === 'image') ??
          list[0];
        return img?.src ?? null;
      })
    ).then((results) => {
      if (!cancelled) {
        setSrcs(results.filter((s): s is string => s !== null));
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charKey]);

  useEffect(() => {
    if (srcs.length <= 1) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % srcs.length),
      3000
    );
    return () => clearInterval(t);
  }, [srcs.length]);

  return {
    src: srcs.length > 0 ? srcs[idx] : null,
    idx,
    total: srcs.length,
    goTo: setIdx,
  };
}

function TwEventCard({ event }: { event: TwEvent }) {
  const { accent } = useGradientAccent();
  const { src, idx, total, goTo } = useTwIllustration(event.characters);
  const imageSrc = src ?? placeholderEventImage;
  const active = isTwEventActive(event);
  const typeColor = TW_TYPE_COLOR[event.type] ?? 'gray';

  return (
    <Card
      radius="md"
      withBorder
      padding={0}
      {...getCardHoverProps()}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Card.Section style={{ position: 'relative' }}>
        <Image src={imageSrc} height={160} fit="cover" alt={event.name} />
        {total > 1 && (
          <Group
            gap={6}
            justify="center"
            style={{ position: 'absolute', bottom: 8, left: 0, right: 0 }}
          >
            {Array.from({ length: total }, (_, i) => (
              <Box
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i === idx ? 'white' : 'rgba(255,255,255,0.45)',
                  border: '1px solid rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
            ))}
          </Group>
        )}
      </Card.Section>
      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        <Group gap="xs" wrap="wrap">
          <Badge size="xs" variant="light" color={typeColor} radius="sm">
            {event.type}
          </Badge>
          <Badge
            size="xs"
            variant="light"
            color={active ? 'green' : 'gray'}
            radius="sm"
          >
            {active ? 'Active' : 'Ended'}
          </Badge>
        </Group>

        <Text fw={600} size="md" lineClamp={2}>
          {event.name}
        </Text>

        {event.characters.length > 0 && (
          <Group gap={6} wrap="wrap">
            {event.characters.map((char) => (
              <CharacterPortrait
                key={char}
                name={char}
                size={36}
                link
                tooltip={char}
                loading="lazy"
              />
            ))}
          </Group>
        )}

        <Stack gap={2} mt="auto">
          {event.start_date && event.start_date.length >= 10 && (
            <Group gap={4}>
              <Text size="xs" c="dimmed" span>
                Started:
              </Text>
              <Text size="xs" span>
                {event.start_date}
              </Text>
            </Group>
          )}
          {event.end_date && event.end_date.length >= 10 && (
            <Group gap={4}>
              <Text size="xs" c="dimmed" span>
                {active ? 'Ends:' : 'Ended:'}
              </Text>
              <Text size="xs" span>
                {event.end_date}
              </Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

function EventCard({ event }: { event: GameEvent }) {
  const { accent } = useGradientAccent();
  const image = getEventImage(event.name);

  return (
    <Card
      radius="md"
      withBorder
      padding={0}
      {...getCardHoverProps()}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Card.Section>
        <Image src={image} height={160} fit="cover" alt={event.name} />
      </Card.Section>
      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        <Group gap="xs" wrap="wrap">
          {event.badge && (
            <Badge size="xs" variant="light" color={accent.primary} radius="sm">
              {event.badge}
            </Badge>
          )}
          <Badge
            size="xs"
            variant="light"
            color={event.active ? 'green' : 'gray'}
            radius="sm"
          >
            {event.active ? 'Active' : 'Ended'}
          </Badge>
        </Group>

        <Text fw={600} size="md" lineClamp={2}>
          {event.name}
        </Text>

        {event.description && (
          <Text size="sm" c="dimmed">
            {event.description}
          </Text>
        )}

        <Stack gap={2} mt="auto">
          {event.start_date && (
            <Group gap={4}>
              <Text size="xs" c="dimmed" span>
                Started:
              </Text>
              <Text size="xs" span>
                {event.start_date}
              </Text>
            </Group>
          )}
          {event.end_date && (
            <Group gap={4}>
              <Text size="xs" c="dimmed" span>
                Ended:
              </Text>
              <Text size="xs" span>
                {event.end_date}
              </Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

function EventGridSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height={240} radius="md" />
      ))}
    </SimpleGrid>
  );
}

export default function Events() {
  const { accent } = useGradientAccent();
  const {
    data: events,
    loading,
    error,
  } = useDataFetch<GameEvent[]>('data/events.json', []);

  const {
    data: twEvents,
    loading: twLoading,
    error: twError,
  } = useDataFetch<TwEvent[]>('data/events_tw.json', []);

  const [tabParam, handleTabChange] = useTabParam('tab', 'active', [
    'active',
    'past',
    'tw',
  ]);
  const tab = tabParam as TabFilter;

  // Global events filtering
  const filtered = events.filter((e) =>
    tab === 'active' ? e.active : !e.active
  );

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    EVENTS_PER_PAGE,
    tab
  );
  const paginated = filtered.slice(offset, offset + EVENTS_PER_PAGE);

  // TW events — sort newest first
  const sortedTwEvents = [...twEvents].sort((a, b) =>
    b.start_date.localeCompare(a.start_date)
  );
  const {
    page: twPage,
    setPage: setTwPage,
    totalPages: twTotalPages,
    offset: twOffset,
  } = usePagination(sortedTwEvents.length, EVENTS_PER_PAGE, 'tw');
  const paginatedTw = sortedTwEvents.slice(twOffset, twOffset + EVENTS_PER_PAGE);

  const mostRecentUpdate = getLatestTimestamp(events);

  const activeCount = events.filter((e) => e.active).length;
  const pastCount = events.filter((e) => !e.active).length;
  const twActiveCount = twEvents.filter(isTwEventActive).length;

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Events</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
        </Group>

        <Alert
          icon={<IoInformationCircleOutline size={IMAGE_SIZE.ICON_LG} />}
          color={accent.primary}
          variant="light"
        >
          <Text size="sm">
            Event tracking began on <strong>March 9, 2026</strong>. Events
            active before this date may be missing or have incomplete start
            dates.
          </Text>
        </Alert>

        <Tabs value={tab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab
              value="active"
              leftSection={<IoCalendar size={14} />}
              rightSection={
                activeCount > 0 ? (
                  <Badge size="xs" variant="light" color={accent.primary}>
                    {activeCount}
                  </Badge>
                ) : undefined
              }
            >
              Active Events
            </Tabs.Tab>
            <Tabs.Tab
              value="past"
              leftSection={<IoCalendarOutline size={14} />}
              rightSection={
                pastCount > 0 ? (
                  <Badge size="xs" variant="light" color={accent.primary}>
                    {pastCount}
                  </Badge>
                ) : undefined
              }
            >
              Past Events
            </Tabs.Tab>
            <Tabs.Tab
              value="tw"
              leftSection={<IoGlobeOutline size={14} />}
              rightSection={
                twActiveCount > 0 ? (
                  <Badge size="xs" variant="light" color={accent.primary}>
                    {twActiveCount}
                  </Badge>
                ) : undefined
              }
            >
              TW Server
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Global events tabs */}
        {tab !== 'tw' && (
          <>
            {loading && <EventGridSkeleton />}

            {!loading && error && (
              <DataFetchError
                title="Could not load events"
                message={error.message}
                onRetry={() => window.location.reload()}
              />
            )}

            {!loading && !error && filtered.length === 0 && (
              <EmptyState
                icon={<IoCalendarOutline size={32} />}
                title={tab === 'active' ? 'No active events' : 'No past events'}
                description={
                  tab === 'active'
                    ? 'There are no active in-game events right now. Check back later!'
                    : 'No past events have been recorded yet.'
                }
                color={accent.primary}
              />
            )}

            {!loading && !error && paginated.length > 0 && (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {paginated.map((event) => (
                  <EventCard key={event.event_id ?? event.name} event={event} />
                ))}
              </SimpleGrid>
            )}

            {!loading && !error && (
              <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                onChange={setPage}
                scrollToTop
              />
            )}
          </>
        )}

        {/* TW Server tab */}
        {tab === 'tw' && (
          <>
            {twLoading && <EventGridSkeleton />}

            {!twLoading && twError && (
              <DataFetchError
                title="Could not load TW events"
                message={twError.message}
                onRetry={() => window.location.reload()}
              />
            )}

            {!twLoading && !twError && sortedTwEvents.length === 0 && (
              <EmptyState
                icon={<IoGlobeOutline size={32} />}
                title="No TW server events"
                description="No Taiwan server events have been recorded yet."
                color={accent.primary}
              />
            )}

            {!twLoading && !twError && paginatedTw.length > 0 && (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {paginatedTw.map((event) => (
                  <TwEventCard key={event.name} event={event} />
                ))}
              </SimpleGrid>
            )}

            {!twLoading && !twError && (
              <PaginationControl
                currentPage={twPage}
                totalPages={twTotalPages}
                onChange={setTwPage}
                scrollToTop
              />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
