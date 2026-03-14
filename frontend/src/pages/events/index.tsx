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
import GlobalBadge from '@/components/ui/GlobalBadge';
import EventCharacterAvatars from '@/features/wiki/events/components/EventCharacterAvatars';
import TwEventBanner from '@/features/wiki/events/components/TwEventBanner';
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
import type { GameEvent } from '@/types';
import { getLatestTimestamp } from '@/utils';
import { getEventTypeColor, isGameEventActive } from '@/utils/event-utils';
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
  types: string[];
  characters: string[];
  dateRange: [Date | null, Date | null];
}

const EMPTY_EVENT_FILTERS: EventFilters = {
  search: '',
  servers: [],
  types: [],
  characters: [],
  dateRange: [null, null],
};

interface EventEntry {
  id: string;
  active: boolean;
  server: 'Global' | 'TW';
  sortDate: string;
  event: GameEvent;
}

function EventBadges({
  server,
  type,
  typeColor,
  active,
}: {
  server: 'Global' | 'TW';
  type?: string | null;
  typeColor?: string;
  active: boolean;
}) {
  return (
    <Group gap="xs" wrap="wrap">
      <GlobalBadge isGlobal={server === 'Global'} size="sm" />
      {type ? (
        <Badge
          size="xs"
          variant="light"
          color={typeColor ?? 'gray'}
          radius="sm"
        >
          {type}
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
  typeOptions,
  characterOptions,
}: {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  serverOptions: string[];
  typeOptions: string[];
  characterOptions: string[];
}) {
  const isMobile = useIsMobile();
  const chipSize = isMobile ? 'md' : 'xs';
  const hasFilters =
    filters.search !== '' ||
    filters.servers.length > 0 ||
    filters.types.length > 0 ||
    filters.characters.length > 0 ||
    filters.dateRange[0] !== null ||
    filters.dateRange[1] !== null;
  const groups = [
    serverOptions.length > 0
      ? { key: 'servers', label: 'Server', options: serverOptions }
      : null,
    typeOptions.length > 0
      ? { key: 'types', label: 'Type', options: typeOptions }
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
        types: filters.types,
      }}
      onChange={(key, value) => onChange({ ...filters, [key]: value })}
      onClear={() => onChange(EMPTY_EVENT_FILTERS)}
      hasActiveFilters={hasFilters}
      search={filters.search}
      onSearchChange={(value) => onChange({ ...filters, search: value })}
      searchPlaceholder="Search by name, type, or character..."
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

function useEventDisplay(event: GameEvent) {
  const { accent } = useGradientAccent();
  const image = getEventImage(event.name) ?? placeholderEventImage;
  const active = isGameEventActive(event);
  const typeColor = event.is_global
    ? accent.primary
    : getEventTypeColor(event.type);
  return { image, active, typeColor };
}

function EventCard({ event }: { event: GameEvent }) {
  const { image, active, typeColor } = useEventDisplay(event);

  return (
    <Card
      radius="md"
      withBorder
      padding={0}
      {...getCardHoverProps()}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Card.Section style={{ position: 'relative' }}>
        {event.is_global ? (
          <Image src={image} height={160} fit="cover" alt={event.name} />
        ) : (
          <TwEventBanner
            characters={event.characters}
            height={160}
            radius="0"
          />
        )}
      </Card.Section>
      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        <EventBadges
          server={event.is_global ? 'Global' : 'TW'}
          type={event.type}
          typeColor={typeColor}
          active={active}
        />

        <Text fw={600} size="md" lineClamp={2}>
          {event.name}
        </Text>

        {event.characters.length > 0 && (
          <EventCharacterAvatars characters={event.characters} />
        )}

        {event.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {event.description}
          </Text>
        )}

        <EventDates
          startDate={event.start_date}
          endDate={event.end_date}
          active={active}
          size="xs"
        />
      </Stack>
    </Card>
  );
}

function EventListItem({ event }: { event: GameEvent }) {
  const { image, active, typeColor } = useEventDisplay(event);

  return (
    <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
      <Group align="stretch" gap="md" wrap="nowrap">
        {event.is_global ? (
          <Image
            src={image}
            w={160}
            h={96}
            radius="md"
            fit="cover"
            alt={event.name}
            visibleFrom="sm"
          />
        ) : (
          <TwEventBanner
            characters={event.characters}
            height={96}
            width={160}
            visibleFrom="sm"
          />
        )}
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <EventBadges
            server={event.is_global ? 'Global' : 'TW'}
            type={event.type}
            typeColor={typeColor}
            active={active}
          />

          <Text fw={600} size="lg">
            {event.name}
          </Text>

          {event.characters.length > 0 && (
            <EventCharacterAvatars characters={event.characters} />
          )}

          {event.description && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {event.description}
            </Text>
          )}

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

function renderEvents(items: EventEntry[], viewMode: ViewMode) {
  if (viewMode === 'list') {
    return (
      <Stack gap="md">
        {items.map((entry) => (
          <EventListItem key={entry.id} event={entry.event} />
        ))}
      </Stack>
    );
  }
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
      {items.map((entry) => (
        <EventCard key={entry.id} event={entry.event} />
      ))}
    </SimpleGrid>
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
    return events
      .map((event) => ({
        id: `${event.name}__${event.is_global ? 'global' : 'tw'}`,
        active: isGameEventActive(event),
        server: (event.is_global ? 'Global' : 'TW') as 'Global' | 'TW',
        sortDate: event.start_date ?? event.end_date ?? '',
        event,
      }))
      .sort((a, b) => {
        const dateCompare = (b.sortDate ?? '').localeCompare(a.sortDate ?? '');
        if (dateCompare !== 0) return dateCompare;
        return a.event.name.localeCompare(b.event.name);
      });
  }, [events]);

  const scopedEvents = useMemo(
    () =>
      allEvents.filter((event) =>
        tab === 'active' ? event.active : !event.active
      ),
    [allEvents, tab]
  );

  const serverOptions = useMemo(
    () => [...new Set(scopedEvents.map((entry) => entry.server))].sort(),
    [scopedEvents]
  );

  const typeOptions = useMemo(
    () =>
      [
        ...new Set(
          scopedEvents
            .map((entry) => entry.event.type)
            .filter(Boolean) as string[]
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [scopedEvents]
  );

  const characterOptions = useMemo(
    () =>
      [
        ...new Set(scopedEvents.flatMap((entry) => entry.event.characters)),
      ].sort(),
    [scopedEvents]
  );

  const filtered = useMemo(() => {
    const search = eventFilters.search.trim().toLowerCase();

    return scopedEvents.filter((entry) => {
      const ev = entry.event;
      if (search) {
        const haystack = [
          ev.name,
          ev.description,
          ev.type ?? '',
          entry.server,
          ...ev.characters,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (
        eventFilters.servers.length > 0 &&
        !eventFilters.servers.includes(entry.server)
      ) {
        return false;
      }
      if (eventFilters.types.length > 0) {
        if (!ev.type || !eventFilters.types.includes(ev.type)) {
          return false;
        }
      }
      if (
        eventFilters.characters.length > 0 &&
        !ev.characters.some((character) =>
          eventFilters.characters.includes(character)
        )
      ) {
        return false;
      }
      const [rangeStart, rangeEnd] = eventFilters.dateRange;
      if (rangeStart !== null || rangeEnd !== null) {
        const parseLocal = (s: string) => {
          const [y, m, d] = s.split('-').map(Number);
          return new Date(y, m - 1, d);
        };
        const eventStart = ev.start_date ? parseLocal(ev.start_date) : null;
        const eventEnd = ev.end_date
          ? (() => {
              const d = parseLocal(ev.end_date);
              d.setHours(23, 59, 59, 999);
              return d;
            })()
          : null;
        if (rangeStart !== null && eventEnd !== null && eventEnd < rangeStart) {
          return false;
        }
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

  const mostRecentUpdate = getLatestTimestamp(events) || 0;

  const activeCount = allEvents.filter((event) => event.active).length;
  const pastCount = allEvents.filter((event) => !event.active).length;
  const eventFilterCount = countActiveFilters(eventFilters);

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm" align="baseline">
            <Title order={1}>Events</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          {!loading && !error && (
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
                typeOptions={typeOptions}
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

        {loading &&
          (eventViewMode === 'list' ? (
            <EventListSkeleton />
          ) : (
            <EventGridSkeleton />
          ))}

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

        {!loading &&
          !error &&
          paginated.length > 0 &&
          renderEvents(paginated, eventViewMode)}

        {!loading && !error && (
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
