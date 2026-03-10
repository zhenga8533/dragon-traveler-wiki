import {
  Alert,
  Badge,
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
import {
  IoCalendar,
  IoCalendarOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5';
import { getEventImage } from '../assets/event';
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
import type { GameEvent } from '../types/event';
import { getLatestTimestamp } from '../utils';

const EVENTS_PER_PAGE = 12;

type TabFilter = 'active' | 'past';

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

  const [tabParam, handleTabChange] = useTabParam('tab', 'active', [
    'active',
    'past',
  ]);
  const tab = tabParam as TabFilter;

  const filtered = events.filter((e) =>
    tab === 'active' ? e.active : !e.active
  );

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    EVENTS_PER_PAGE,
    tab
  );
  const paginated = filtered.slice(offset, offset + EVENTS_PER_PAGE);

  const mostRecentUpdate = getLatestTimestamp(events);

  const activeCount = events.filter((e) => e.active).length;
  const pastCount = events.filter((e) => !e.active).length;

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
                  <Badge size="xs" variant="light" color="gray">
                    {pastCount}
                  </Badge>
                ) : undefined
              }
            >
              Past Events
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

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
      </Stack>
    </Container>
  );
}
