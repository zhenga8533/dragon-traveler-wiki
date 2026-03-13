import { getPortrait } from '@/assets/character';
import { getEventImage, placeholderEventImage } from '@/assets/event';
import EntityFilter from '@/components/common/EntityFilter';
import {
  FilterMultiSelect,
  FilterSection,
} from '@/components/common/FilterControls';
import LastUpdated from '@/components/common/LastUpdated';
import PageFilterHeaderControls from '@/components/layout/PageFilterHeaderControls';
import DataFetchError from '@/components/ui/DataFetchError';
import EmptyState from '@/components/ui/EmptyState';
import PaginationControl from '@/components/ui/PaginationControl';
import { getCardHoverProps } from '@/constants/styles';
import { IMAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import GlobalBadge from '@/features/teams/components/GlobalBadge';
import EventCharacterAvatars from '@/features/wiki/components/EventCharacterAvatars';
import TwEventBanner from '@/features/wiki/components/TwEventBanner';
import type { ViewMode } from '@/hooks';
import {
  countActiveFilters,
  getPageSizeStorageKey,
  useDataFetch,
  useFilterPanel,
  useFilters,
  useGradientAccent,
  useIsMobile,
  usePageSize,
  usePagination,
  useTabParam,
  useViewMode,
} from '@/hooks';
import type { GameEvent, TwEvent } from '@/types';
import { getLatestTimestamp } from '@/utils';
import { getTwEventTypeColor, isTwEventActive } from '@/utils/event-utils';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image,
  Paper,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useEffect, useMemo } from 'react';
import { IoCalendarOutline, IoInformationCircleOutline } from 'react-icons/io5';

const EVENTS_PER_PAGE = 12;
const EVENT_PAGE_SIZE_OPTIONS: Record<ViewMode, readonly number[]> = {
  grid: [12, 18, 24, 36],
  list: [6, 12, 18, 24],
};

type TabFilter = 'active' | 'past';

interface EventFilters {
  search: string;
  servers: string[];
  tags: string[];
  characters: string[];
  dateRange: [Date | null, Date | null];
}

const EMPTY_EVENT_FILTERS: EventFilters = {
  search: '',
  servers: [],
  tags: [],
  characters: [],
  dateRange: [null, null],
};

type EventEntry =
  | {
      kind: 'global';
      id: string;
      active: boolean;
      name: string;
      tag: string | null;
      server: 'Global';
      description: string;
      characters: string[];
      startDate: string | null;
      endDate: string | null;
      sortDate: string;
      event: GameEvent;
    }
  | {
      kind: 'tw';
      id: string;
      active: boolean;
      name: string;
      tag: string;
      server: 'TW';
      description: string;
      characters: string[];
      startDate: string | null;
      endDate: string | null;
      sortDate: string;
      event: TwEvent;
    };

function EventBadges({
  server,
  tag,
  tagColor,
  active,
}: {
  server: 'Global' | 'TW';
  tag?: string | null;
  tagColor?: string;
  active: boolean;
}) {
  return (
    <Group gap="xs" wrap="wrap">
      <GlobalBadge isGlobal={server === 'Global'} size="sm" />
      {tag ? (
        <Badge size="xs" variant="light" color={tagColor ?? 'gray'} radius="sm">
          {tag}
        </Badge>
      ) : null}
      <Badge
        size="xs"
        variant="light"
        color={active ? 'green' : 'gray'}
        radius="sm"
      >
        {active ? 'Active' : 'Ended'}
      </Badge>
    </Group>
  );
}

function EventDates({
  startDate,
  endDate,
  active,
  size = 'sm',
}: {
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  size?: 'xs' | 'sm';
}) {
  return (
    <Group gap="md" wrap="wrap" mt="auto">
      {startDate ? (
        <Text size={size}>
          <Text span c="dimmed">
            Started:
          </Text>{' '}
          {startDate}
        </Text>
      ) : null}
      {endDate ? (
        <Text size={size}>
          <Text span c="dimmed">
            {active ? 'Ends:' : 'Ended:'}
          </Text>{' '}
          {endDate}
        </Text>
      ) : null}
    </Group>
  );
}

function EventFilter({
  filters,
  onChange,
  serverOptions,
  tagOptions,
  characterOptions,
}: {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  serverOptions: string[];
  tagOptions: string[];
  characterOptions: string[];
}) {
  const isMobile = useIsMobile();
  const chipSize = isMobile ? 'md' : 'xs';
  const hasFilters =
    filters.search !== '' ||
    filters.servers.length > 0 ||
    filters.tags.length > 0 ||
    filters.characters.length > 0 ||
    filters.dateRange[0] !== null ||
    filters.dateRange[1] !== null;
  const groups = [
    serverOptions.length > 0
      ? { key: 'servers', label: 'Server', options: serverOptions }
      : null,
    tagOptions.length > 0
      ? { key: 'tags', label: 'Tag', options: tagOptions }
      : null,
  ].filter(
    (group): group is { key: string; label: string; options: string[] } =>
      group !== null
  );

  return (
    <EntityFilter
      groups={groups}
      selected={{
        servers: filters.servers,
        tags: filters.tags,
      }}
      onChange={(key, value) => onChange({ ...filters, [key]: value })}
      onClear={() => onChange(EMPTY_EVENT_FILTERS)}
      hasActiveFilters={hasFilters}
      search={filters.search}
      onSearchChange={(value) => onChange({ ...filters, search: value })}
      searchPlaceholder="Search by name, tag, or character..."
      afterGroups={
        <>
          {characterOptions.length > 0 ? (
            <FilterSection label="Character">
              <FilterMultiSelect
                data={characterOptions}
                value={filters.characters}
                onChange={(value) =>
                  onChange({ ...filters, characters: value })
                }
                placeholder="Filter by character..."
                renderOption={({ option }) => {
                  const portrait = getPortrait(option.label);
                  return (
                    <Group gap="xs" align="center">
                      {portrait ? (
                        <Image
                          src={portrait}
                          alt=""
                          w={20}
                          h={20}
                          fit="contain"
                          radius="sm"
                        />
                      ) : null}
                      <Text size="sm">{option.label}</Text>
                    </Group>
                  );
                }}
                searchable={characterOptions.length >= 8}
                clearable
                size={chipSize}
                style={{ flex: 1, minWidth: 180 }}
                comboboxProps={{ withinPortal: !isMobile }}
              />
            </FilterSection>
          ) : null}

          <FilterSection label="Date Range">
            <DatePickerInput
              type="range"
              value={filters.dateRange}
              onChange={(value) =>
                onChange({
                  ...filters,
                  dateRange: value as [Date | null, Date | null],
                })
              }
              placeholder="Pick date range"
              clearable
              size={chipSize}
              valueFormat="MMM D, YYYY"
              style={{ minWidth: 220 }}
            />
          </FilterSection>
        </>
      }
    />
  );
}

function TwEventCard({ event }: { event: TwEvent }) {
  const active = isTwEventActive(event);
  const typeColor = getTwEventTypeColor(event.type);

  return (
    <Card
      radius="md"
      withBorder
      padding={0}
      {...getCardHoverProps()}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Card.Section style={{ position: 'relative' }}>
        <TwEventBanner characters={event.characters} height={160} radius="0" />
      </Card.Section>
      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        <EventBadges
          server="TW"
          tag={event.type}
          tagColor={typeColor}
          active={active}
        />

        <Text fw={600} size="md" lineClamp={2}>
          {event.name}
        </Text>

        <EventCharacterAvatars characters={event.characters} />

        <Stack gap={2} mt="auto">
          <EventDates
            startDate={event.start_date}
            endDate={event.end_date}
            active={active}
            size="xs"
          />
        </Stack>
      </Stack>
    </Card>
  );
}

function EventCard({ event }: { event: GameEvent }) {
  const { accent } = useGradientAccent();
  const image = getEventImage(event.name) ?? placeholderEventImage;

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
        <EventBadges
          server="Global"
          tag={event.tag}
          tagColor={accent.primary}
          active={event.active}
        />

        <Text fw={600} size="md" lineClamp={2}>
          {event.name}
        </Text>

        {event.description && (
          <Text size="sm" c="dimmed">
            {event.description}
          </Text>
        )}

        <Stack gap={2} mt="auto">
          <EventDates
            startDate={event.start_date}
            endDate={event.end_date}
            active={event.active}
            size="xs"
          />
        </Stack>
      </Stack>
    </Card>
  );
}

function EventListItem({ event }: { event: GameEvent }) {
  const { accent } = useGradientAccent();
  const image = getEventImage(event.name) ?? placeholderEventImage;

  return (
    <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
      <Group align="stretch" gap="md" wrap="nowrap">
        <Image
          src={image}
          w={160}
          h={96}
          radius="md"
          fit="cover"
          alt={event.name}
          visibleFrom="sm"
        />
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <EventBadges
            server="Global"
            tag={event.tag}
            tagColor={accent.primary}
            active={event.active}
          />

          <Text fw={600} size="lg">
            {event.name}
          </Text>

          {event.description && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {event.description}
            </Text>
          )}

          <EventDates
            startDate={event.start_date}
            endDate={event.end_date}
            active={event.active}
          />
        </Stack>
      </Group>
    </Paper>
  );
}

function TwEventListItem({ event }: { event: TwEvent }) {
  const active = isTwEventActive(event);
  const typeColor = getTwEventTypeColor(event.type);

  return (
    <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
      <Group align="stretch" gap="md" wrap="nowrap">
        <TwEventBanner
          characters={event.characters}
          height={96}
          width={160}
          visibleFrom="sm"
        />

        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <EventBadges
            server="TW"
            tag={event.type}
            tagColor={typeColor}
            active={active}
          />

          <Text fw={600} size="lg">
            {event.name}
          </Text>

          <EventCharacterAvatars characters={event.characters} />

          <EventDates
            startDate={event.start_date}
            endDate={event.end_date}
            active={active}
          />
        </Stack>
      </Group>
    </Paper>
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

function EventListSkeleton() {
  return (
    <Stack gap="md">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height={140} radius="md" />
      ))}
    </Stack>
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
  ]);
  const tab = tabParam as TabFilter;

  const { filters: eventFilters, setFilters: setEventFilters } =
    useFilters<EventFilters>({
      emptyFilters: EMPTY_EVENT_FILTERS,
      storageKey: STORAGE_KEY.EVENT_FILTERS,
    });
  const { isOpen: eventFilterOpen, toggle: toggleEventFilter } =
    useFilterPanel();
  const [eventViewMode, setEventViewMode] = useViewMode({
    storageKey: STORAGE_KEY.EVENT_VIEW_MODE,
    defaultMode: 'grid',
  });

  const allEvents = useMemo<EventEntry[]>(() => {
    const globalEvents: EventEntry[] = events.map((event) => ({
      kind: 'global',
      id: event.event_id ?? `global:${event.name}`,
      active: event.active,
      name: event.name,
      tag: event.tag ?? null,
      server: 'Global',
      description: event.description ?? '',
      characters: [],
      startDate: event.start_date ?? null,
      endDate: event.end_date,
      sortDate: event.start_date ?? event.end_date ?? '',
      event,
    }));

    const taiwanEvents: EventEntry[] = twEvents.map((event) => ({
      kind: 'tw',
      id: `tw:${event.name}:${event.start_date}`,
      active: isTwEventActive(event),
      name: event.name,
      tag: event.type,
      server: 'TW',
      description: '',
      characters: event.characters,
      startDate: event.start_date,
      endDate: event.end_date,
      sortDate: event.start_date ?? event.end_date ?? '',
      event,
    }));

    return [...globalEvents, ...taiwanEvents].sort((a, b) => {
      const dateCompare = (b.sortDate ?? '').localeCompare(a.sortDate ?? '');
      if (dateCompare !== 0) return dateCompare;
      return a.name.localeCompare(b.name);
    });
  }, [events, twEvents]);

  const scopedEvents = useMemo(
    () =>
      allEvents.filter((event) =>
        tab === 'active' ? event.active : !event.active
      ),
    [allEvents, tab]
  );

  const serverOptions = useMemo(
    () => [...new Set(scopedEvents.map((event) => event.server))].sort(),
    [scopedEvents]
  );

  const tagOptions = useMemo(
    () =>
      [
        ...new Set(
          scopedEvents.map((event) => event.tag).filter(Boolean) as string[]
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [scopedEvents]
  );

  const characterOptions = useMemo(
    () =>
      [...new Set(scopedEvents.flatMap((event) => event.characters))].sort(),
    [scopedEvents]
  );

  const filtered = useMemo(() => {
    const search = eventFilters.search.trim().toLowerCase();

    return scopedEvents.filter((event) => {
      if (search) {
        const haystack = [
          event.name,
          event.description,
          event.tag ?? '',
          event.server,
          ...event.characters,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (
        eventFilters.servers.length > 0 &&
        !eventFilters.servers.includes(event.server)
      ) {
        return false;
      }
      if (eventFilters.tags.length > 0) {
        if (!event.tag || !eventFilters.tags.includes(event.tag)) {
          return false;
        }
      }
      if (
        eventFilters.characters.length > 0 &&
        !event.characters.some((character) =>
          eventFilters.characters.includes(character)
        )
      ) {
        return false;
      }
      const [rangeStart, rangeEnd] = eventFilters.dateRange;
      if (rangeStart !== null || rangeEnd !== null) {
        // Parse YYYY-MM-DD strings as local dates (not UTC) so they match
        // the local-midnight Date objects returned by DatePickerInput
        const parseLocal = (s: string) => {
          const [y, m, d] = s.split('-').map(Number);
          return new Date(y, m - 1, d);
        };
        const eventStart = event.startDate ? parseLocal(event.startDate) : null;
        // Set event end to end-of-day so a range starting on the same day still matches
        const eventEnd = event.endDate
          ? (() => {
              const d = parseLocal(event.endDate);
              d.setHours(23, 59, 59, 999);
              return d;
            })()
          : null;
        // Exclude events that end before rangeStart
        if (rangeStart !== null && eventEnd !== null && eventEnd < rangeStart) {
          return false;
        }
        // Exclude events that start after rangeEnd (treat rangeEnd as end-of-day)
        if (rangeEnd !== null && eventStart !== null) {
          const rangeEndOfDay = new Date(rangeEnd);
          rangeEndOfDay.setHours(23, 59, 59, 999);
          if (eventStart > rangeEndOfDay) return false;
        }
      }
      return true;
    });
  }, [scopedEvents, eventFilters]);

  const {
    pageSize: eventPageSize,
    setPageSize: setEventPageSize,
    pageSizeOptions: eventPageSizeOptions,
  } = usePageSize(EVENT_PAGE_SIZE_OPTIONS[eventViewMode], {
    defaultSize: EVENTS_PER_PAGE,
    storageKey: getPageSizeStorageKey(STORAGE_KEY.EVENT_VIEW_MODE),
  });

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    eventPageSize,
    `${tab}:${JSON.stringify(eventFilters)}`
  );

  useEffect(() => {
    setPage(1);
  }, [eventPageSize, setPage]);

  const paginated = filtered.slice(offset, offset + eventPageSize);

  const mostRecentUpdate = Math.max(
    getLatestTimestamp(events) || 0,
    getLatestTimestamp(twEvents) || 0
  );

  const activeCount = allEvents.filter((event) => event.active).length;
  const pastCount = allEvents.filter((event) => !event.active).length;
  const eventFilterCount = countActiveFilters(eventFilters);
  const isLoading = loading || twLoading;
  const combinedError = error ?? twError;

  const renderEvents = (items: EventEntry[], viewMode: ViewMode) => {
    if (viewMode === 'list') {
      return (
        <Stack gap="md">
          {items.map((event) =>
            event.kind === 'global' ? (
              <EventListItem key={event.id} event={event.event} />
            ) : (
              <TwEventListItem key={event.id} event={event.event} />
            )
          )}
        </Stack>
      );
    }

    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {items.map((event) =>
          event.kind === 'global' ? (
            <EventCard key={event.id} event={event.event} />
          ) : (
            <TwEventCard key={event.id} event={event.event} />
          )
        )}
      </SimpleGrid>
    );
  };

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm" align="baseline">
            <Title order={1}>Events</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          {!isLoading && !combinedError && (
            <PageFilterHeaderControls
              viewMode={eventViewMode}
              onViewModeChange={setEventViewMode}
              filterCount={eventFilterCount}
              filterOpen={eventFilterOpen}
              onFilterToggle={toggleEventFilter}
            >
              <EventFilter
                filters={eventFilters}
                onChange={setEventFilters}
                serverOptions={serverOptions}
                tagOptions={tagOptions}
                characterOptions={characterOptions}
              />
            </PageFilterHeaderControls>
          )}
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
          <ScrollArea type="auto" scrollbarSize={5} offsetScrollbars>
            <Tabs.List style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
              <Tabs.Tab
                value="active"
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
            </Tabs.List>
          </ScrollArea>
        </Tabs>

        {isLoading &&
          (eventViewMode === 'list' ? (
            <EventListSkeleton />
          ) : (
            <EventGridSkeleton />
          ))}

        {!isLoading && combinedError && (
          <DataFetchError
            title="Could not load events"
            message={combinedError.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!isLoading && !combinedError && filtered.length === 0 && (
          <EmptyState
            icon={<IoCalendarOutline size={32} />}
            title={tab === 'active' ? 'No active events' : 'No past events'}
            description={
              eventFilterCount > 0
                ? `No ${tab} events match the current filters.`
                : tab === 'active'
                  ? 'There are no active events right now. Check back later!'
                  : 'No past events have been recorded yet.'
            }
            color={accent.primary}
            action={
              eventFilterCount > 0 ? (
                <Button
                  size="xs"
                  variant="light"
                  color={accent.primary}
                  onClick={() => setEventFilters(EMPTY_EVENT_FILTERS)}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}

        {!isLoading &&
          !combinedError &&
          paginated.length > 0 &&
          renderEvents(paginated, eventViewMode)}

        {!isLoading && !combinedError && (
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            onChange={setPage}
            totalItems={filtered.length}
            pageSize={eventPageSize}
            pageSizeOptions={eventPageSizeOptions}
            onPageSizeChange={setEventPageSize}
            scrollToTop
          />
        )}
      </Stack>
    </Container>
  );
}
