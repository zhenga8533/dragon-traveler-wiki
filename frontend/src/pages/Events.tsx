import {
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useMemo } from 'react';
import {
  IoCalendar,
  IoCalendarOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5';
import { getEventImage, placeholderEventImage } from '../assets/event';
import CharacterPortrait from '../components/character/CharacterPortrait';
import DataFetchError from '../components/common/DataFetchError';
import EmptyState from '../components/common/EmptyState';
import {
  FilterChipGroup,
  FilterClearButton,
  FilterMultiSelect,
  FilterSearchInput,
  FilterSection,
} from '../components/common/FilterControls';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import PaginationControl from '../components/common/PaginationControl';
import TwEventBanner from '../components/common/TwEventBanner';
import PageFilterHeaderControls from '../components/layout/PageFilterHeaderControls';
import { getCardHoverProps } from '../constants/styles';
import { IMAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import {
  useDataFetch,
  useFilterPanel,
  useFilters,
  useGradientAccent,
  useIsMobile,
  usePageSize,
  usePagination,
  useTabParam,
  useViewMode,
} from '../hooks';
import type { ViewMode } from '../hooks/use-filters';
import { countActiveFilters } from '../hooks/use-filters';
import { getPageSizeStorageKey } from '../hooks/use-pagination';
import type { GameEvent, TwEvent } from '../types';
import { getLatestTimestamp } from '../utils';
import { getTwEventTypeColor, isTwEventActive } from '../utils/event-utils';

const EVENTS_PER_PAGE = 12;
const EVENT_PAGE_SIZE_OPTIONS: Record<ViewMode, readonly number[]> = {
  grid: [12, 18, 24, 36],
  list: [6, 12, 18, 24],
};

type TabFilter = 'active' | 'past';

interface EventFilters {
  search: string;
  servers: string[];
  labels: string[];
  sources: string[];
  characters: string[];
}

const EMPTY_EVENT_FILTERS: EventFilters = {
  search: '',
  servers: [],
  labels: [],
  sources: [],
  characters: [],
};

type EventEntry =
  | {
      kind: 'global';
      id: string;
      active: boolean;
      name: string;
      label: string | null;
      server: 'Global';
      source: string;
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
      label: string;
      server: 'TW';
      source: null;
      description: string;
      characters: string[];
      startDate: string | null;
      endDate: string | null;
      sortDate: string;
      event: TwEvent;
    };

function EventBadges({
  server,
  label,
  labelColor,
  active,
  source,
}: {
  server: 'Global' | 'TW';
  label?: string | null;
  labelColor?: string;
  active: boolean;
  source?: string | null;
}) {
  return (
    <Group gap="xs" wrap="wrap">
      <GlobalBadge isGlobal={server === 'Global'} size="sm" />
      {label ? (
        <Badge
          size="xs"
          variant="light"
          color={labelColor ?? 'gray'}
          radius="sm"
        >
          {label}
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
      {source ? (
        <Badge size="xs" variant="outline" radius="sm">
          {source}
        </Badge>
      ) : null}
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

function EventCharacters({ characters }: { characters: string[] }) {
  if (characters.length === 0) return null;

  return (
    <Group gap="xs" wrap="wrap">
      {characters.map((char) => (
        <CharacterPortrait
          key={char}
          name={char}
          size={IMAGE_SIZE.PORTRAIT_SM}
          link
          tooltip={char}
          loading="lazy"
        />
      ))}
    </Group>
  );
}

function EventFilter({
  filters,
  onChange,
  serverOptions,
  labelOptions,
  sourceOptions,
  characterOptions,
}: {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  serverOptions: string[];
  labelOptions: string[];
  sourceOptions: string[];
  characterOptions: string[];
}) {
  const isMobile = useIsMobile();
  const chipSize = isMobile ? 'md' : 'xs';
  const hasFilters =
    filters.search !== '' ||
    filters.servers.length > 0 ||
    filters.labels.length > 0 ||
    filters.sources.length > 0 ||
    filters.characters.length > 0;

  return (
    <Stack gap={8}>
      <Group gap="xs" align="center" wrap="wrap">
        <FilterSearchInput
          placeholder="Search by name, tag, source, or character..."
          value={filters.search}
          onSearch={(value) => onChange({ ...filters, search: value })}
          size={isMobile ? 'md' : 'xs'}
          style={{ flex: 1, minWidth: 180 }}
        />
        {hasFilters ? (
          <FilterClearButton
            size={isMobile ? 'md' : 'compact-xs'}
            onClick={() => onChange(EMPTY_EVENT_FILTERS)}
          />
        ) : null}
      </Group>

      {serverOptions.length > 0 ? (
        <FilterSection label="Server">
          <FilterChipGroup
            size={chipSize}
            value={filters.servers}
            onChange={(value) => onChange({ ...filters, servers: value })}
            options={serverOptions.map((server) => ({
              value: server,
              label: server,
            }))}
          />
        </FilterSection>
      ) : null}

      {labelOptions.length > 0 ? (
        <FilterSection label="Tag">
          <FilterChipGroup
            size={chipSize}
            value={filters.labels}
            onChange={(value) => onChange({ ...filters, labels: value })}
            options={labelOptions.map((label) => ({
              value: label,
              label,
            }))}
          />
        </FilterSection>
      ) : null}

      {sourceOptions.length > 0 ? (
        <FilterSection label="Source">
          <FilterChipGroup
            size={chipSize}
            value={filters.sources}
            onChange={(value) => onChange({ ...filters, sources: value })}
            options={sourceOptions.map((source) => ({
              value: source,
              label: source,
            }))}
          />
        </FilterSection>
      ) : null}

      {characterOptions.length > 0 ? (
        <FilterSection label="Character">
          <FilterMultiSelect
            data={characterOptions}
            value={filters.characters}
            onChange={(value) => onChange({ ...filters, characters: value })}
            placeholder="Filter by character..."
            searchable={characterOptions.length >= 8}
            clearable
            size={chipSize}
            style={{ flex: 1, minWidth: 180 }}
            comboboxProps={{ withinPortal: !isMobile }}
          />
        </FilterSection>
      ) : null}
    </Stack>
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
          label={event.type}
          labelColor={typeColor}
          active={active}
        />

        <Text fw={600} size="md" lineClamp={2}>
          {event.name}
        </Text>

        <EventCharacters characters={event.characters} />

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
          label={event.badge}
          labelColor={accent.primary}
          active={event.active}
          source={event.source}
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
            label={event.badge}
            labelColor={accent.primary}
            active={event.active}
            source={event.source}
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
            label={event.type}
            labelColor={typeColor}
            active={active}
          />

          <Text fw={600} size="lg">
            {event.name}
          </Text>

          <EventCharacters characters={event.characters} />

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
  const isMobile = useIsMobile();
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
      label: event.badge ?? null,
      server: 'Global',
      source: event.source,
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
      label: event.type,
      server: 'TW',
      source: null,
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

  const labelOptions = useMemo(
    () =>
      [
        ...new Set(
          scopedEvents.map((event) => event.label).filter(Boolean) as string[]
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [scopedEvents]
  );

  const sourceOptions = useMemo(
    () =>
      [
        ...new Set(
          scopedEvents.map((event) => event.source).filter(Boolean) as string[]
        ),
      ].sort(),
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
          event.label ?? '',
          event.source ?? '',
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
      if (eventFilters.labels.length > 0) {
        if (!event.label || !eventFilters.labels.includes(event.label)) {
          return false;
        }
      }
      if (
        eventFilters.sources.length > 0 &&
        (!event.source || !eventFilters.sources.includes(event.source))
      ) {
        return false;
      }
      if (
        eventFilters.characters.length > 0 &&
        !event.characters.some((character) =>
          eventFilters.characters.includes(character)
        )
      ) {
        return false;
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
              onFilterToggle={toggleEventFilter}
              isMobile={isMobile}
            />
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
          </Tabs.List>
        </Tabs>

        {!isLoading && !combinedError && (
          <Collapse in={eventFilterOpen}>
            <Paper
              p="sm"
              radius="md"
              withBorder
              {...getCardHoverProps()}
              bg="var(--mantine-color-body)"
            >
              <EventFilter
                filters={eventFilters}
                onChange={setEventFilters}
                serverOptions={serverOptions}
                labelOptions={labelOptions}
                sourceOptions={sourceOptions}
                characterOptions={characterOptions}
              />
            </Paper>
          </Collapse>
        )}

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
