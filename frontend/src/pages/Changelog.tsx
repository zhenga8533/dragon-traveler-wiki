import {
  Badge,
  Box,
  Button,
  Collapse,
  Container,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import {
  IoAddCircle,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoFilter,
} from 'react-icons/io5';
import { ChangeRecordCard } from '../components/common/ChangeHistory';
import {
  FilterChipGroup,
  FilterClearButton,
  FilterSection,
} from '../components/common/FilterControls';
import PaginationControl from '../components/common/PaginationControl';
import { ListPageLoading } from '../components/layout/PageLoadingSkeleton';
import { getCardHoverProps } from '../constants/styles';
import { useDataFetch, useGradientAccent, useTabParam } from '../hooks';
import { usePagination } from '../hooks/use-pagination';
import type { FieldDiff } from '../types/changes';

// ─── Site changelog types ─────────────────────────────────────────────────────

interface ChangelogEntry {
  date: string;
  version?: string;
  changes: {
    type: 'added' | 'updated' | 'fixed' | 'removed';
    category: string;
    description: string;
  }[];
}

const CHANGE_TYPE_COLORS: Record<string, string> = {
  added: 'green',
  updated: 'blue',
  fixed: 'orange',
  removed: 'red',
};

// ─── Data changes types ───────────────────────────────────────────────────────

interface RawChangeEvent {
  timestamp: number;
  type?: 'removed' | 'readded';
  fields?: Record<string, unknown>;
}

interface EntityHistory {
  added: number;
  changes: RawChangeEvent[];
}

type ChangesFile = Record<string, EntityHistory>;

interface DataEvent {
  id: string;
  timestamp: number;
  entityId: string;
  entityName: string;
  category: string;
  categoryLabel: string;
  eventType: 'updated' | 'removed' | 'readded';
  fields?: Record<string, unknown>;
}

// ─── Known change files ───────────────────────────────────────────────────────

const DATA_FILES: { file: string; label: string }[] = [
  { file: 'characters', label: 'Characters' },
  { file: 'artifacts', label: 'Artifacts' },
  { file: 'tier-lists', label: 'Tier Lists' },
  { file: 'teams', label: 'Teams' },
  { file: 'noble_phantasm', label: 'Noble Phantasms' },
  { file: 'golden_alliances', label: 'Golden Alliances' },
  { file: 'codes', label: 'Codes' },
  { file: 'factions', label: 'Factions' },
  { file: 'gear', label: 'Gear' },
  { file: 'gear_sets', label: 'Gear Sets' },
  { file: 'howlkins', label: 'Howlkins' },
  { file: 'resources', label: 'Resources' },
  { file: 'status-effects', label: 'Status Effects' },
  { file: 'subclasses', label: 'Subclasses' },
  { file: 'wyrmspells', label: 'Wyrmspells' },
  { file: 'useful-links', label: 'Useful Links' },
];

const SITE_PAGE_SIZE = 10;
const DATA_PAGE_SIZE = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Only show quality suffix for characters whose base name appears more than once. */
function formatEntityName(
  entityId: string,
  charNameCounts: Map<string, number>
): string {
  if (entityId.includes('__')) {
    const sep = entityId.indexOf('__');
    const name = entityId.slice(0, sep);
    const quality = entityId.slice(sep + 2);
    return (charNameCounts.get(name) ?? 0) > 1 ? `${name} (${quality})` : name;
  }
  return entityId;
}

function useToggleSet<T>() {
  const [set, setSet] = useState<Set<T>>(new Set());
  const toggle = useCallback((id: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clear = useCallback(() => setSet(new Set()), []);
  return { set, toggle, clear };
}

// ─── Data History tab ─────────────────────────────────────────────────────────

const EVENT_TYPE_COLOR: Record<DataEvent['eventType'], string> = {
  updated: 'blue',
  removed: 'red',
  readded: 'green',
};

const EVENT_TYPE_LABEL: Record<DataEvent['eventType'], string> = {
  updated: 'Updated',
  removed: 'Removed',
  readded: 'Re-added',
};

function DataHistory() {
  const { accent } = useGradientAccent();
  const [events, setEvents] = useState<DataEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const { set: expandedIds, toggle: toggleExpanded, clear: clearExpanded } =
    useToggleSet<string>();

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/';
    Promise.all(
      DATA_FILES.map(async ({ file, label }) => {
        try {
          const res = await fetch(`${base}data/changes/${file}.json`);
          if (!res.ok) return { events: [] as DataEvent[], nameCounts: null };
          const data: ChangesFile = await res.json();

          let nameCounts: Map<string, number> | null = null;
          if (file === 'characters') {
            nameCounts = new Map<string, number>();
            for (const entityId of Object.keys(data)) {
              if (entityId.includes('__')) {
                const name = entityId.slice(0, entityId.indexOf('__'));
                nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
              }
            }
          }

          const out: DataEvent[] = [];
          for (const [entityId, entity] of Object.entries(data)) {
            entity.changes.forEach((change, i) => {
              out.push({
                id: `${file}__${entityId}__${i}`,
                timestamp: change.timestamp,
                entityId,
                entityName: entityId,
                category: file,
                categoryLabel: label,
                eventType:
                  change.type === 'removed'
                    ? 'removed'
                    : change.type === 'readded'
                      ? 'readded'
                      : 'updated',
                fields: change.fields,
              });
            });
          }
          return { events: out, nameCounts };
        } catch {
          return { events: [] as DataEvent[], nameCounts: null };
        }
      })
    ).then((results) => {
      const counts = results.find((r) => r.nameCounts)?.nameCounts ?? new Map();
      const all = results
        .flatMap((r) => r.events)
        .map((e) => ({ ...e, entityName: formatEntityName(e.entityId, counts) }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setEvents(all);
      setLoading(false);
    });
  }, []);

  const filtered =
    selectedCategories.length === 0
      ? events
      : events.filter((e) => selectedCategories.includes(e.category));

  const filterKey = selectedCategories.join(',');
  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    DATA_PAGE_SIZE,
    filterKey
  );
  const pageItems = filtered.slice(offset, offset + DATA_PAGE_SIZE);

  const categoryChipOptions = DATA_FILES.filter(({ file }) =>
    events.some((e) => e.category === file)
  ).map(({ file, label }) => ({ value: file, label }));

  function handleCategoryChange(values: string[]) {
    setSelectedCategories(values);
    clearExpanded();
  }

  function clearFilters() {
    setSelectedCategories([]);
    clearExpanded();
  }

  if (loading) return <ListPageLoading cards={4} />;

  if (events.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="lg">
        No data change history available yet.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {/* Filter bar */}
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Text size="sm" c="dimmed">
          {filtered.length} change{filtered.length !== 1 ? 's' : ''}
        </Text>
        <Button
          variant="default"
          color={accent.primary}
          size="xs"
          leftSection={<IoFilter size={16} />}
          rightSection={
            selectedCategories.length > 0 ? (
              <Badge size="xs" circle variant="filled" color={accent.primary}>
                {selectedCategories.length}
              </Badge>
            ) : null
          }
          onClick={() => setFilterOpen((o) => !o)}
        >
          Filters
        </Button>
      </Group>

      <Collapse in={filterOpen}>
        <Paper p="sm" radius="md" withBorder>
          <Stack gap="xs">
            <FilterSection label="Category">
              <FilterChipGroup
                value={selectedCategories}
                onChange={handleCategoryChange}
                options={categoryChipOptions}
              />
            </FilterSection>
            {selectedCategories.length > 0 && (
              <FilterClearButton onClick={clearFilters} />
            )}
          </Stack>
        </Paper>
      </Collapse>

      {filtered.length === 0 ? (
        <Text c="dimmed" ta="center" py="lg">
          No changes recorded for this category.
        </Text>
      ) : (
        <>
          <Timeline active={-1} bulletSize={28} lineWidth={2}>
            {pageItems.map((event) => {
              const isExpanded = expandedIds.has(event.id);
              const hasFields =
                !!event.fields && Object.keys(event.fields).length > 0;
              const eventColor = EVENT_TYPE_COLOR[event.eventType];

              return (
                <Timeline.Item
                  key={event.id}
                  color={eventColor}
                  bullet={
                    event.eventType === 'removed' ? (
                      <IoCloseCircle size={18} />
                    ) : event.eventType === 'readded' ? (
                      <IoAddCircle size={18} />
                    ) : (
                      <IoCheckmarkCircle size={18} />
                    )
                  }
                  title={
                    <Group justify="space-between" wrap="wrap" gap="xs">
                      <Group gap="xs" wrap="wrap">
                        <Text fw={600} size="sm">
                          {event.entityName}
                        </Text>
                        <Badge size="xs" variant="light" color={accent.secondary}>
                          {event.categoryLabel}
                        </Badge>
                        <Badge size="xs" variant="dot" color={eventColor}>
                          {EVENT_TYPE_LABEL[event.eventType]}
                        </Badge>
                      </Group>
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          {formatShortDate(new Date(event.timestamp * 1000))}
                        </Text>
                        {hasFields && (
                          <Button
                            size="compact-xs"
                            variant="subtle"
                            color={accent.primary}
                            onClick={() => toggleExpanded(event.id)}
                          >
                            {isExpanded ? 'Minimize' : 'Details'}
                          </Button>
                        )}
                      </Group>
                    </Group>
                  }
                >
                  {hasFields && (
                    <Collapse in={isExpanded}>
                      <Box mt="xs">
                        <ChangeRecordCard
                          record={{
                            timestamp: event.timestamp,
                            fields: event.fields as Record<string, FieldDiff>,
                          }}
                        />
                      </Box>
                    </Collapse>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>

          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            onChange={(p) => {
              setPage(p);
              clearExpanded();
            }}
            scrollToTop
          />
        </>
      )}
    </Stack>
  );
}

// ─── Main Changelog page ──────────────────────────────────────────────────────

export default function Changelog() {
  const { accent } = useGradientAccent();
  const { data: changelog, loading } = useDataFetch<ChangelogEntry[]>(
    'data/changelog.json',
    []
  );
  const [activeTab, handleTabChange] = useTabParam('tab', 'site', ['site', 'data']);
  const { set: expandedEntries, toggle: toggleEntry, clear: clearEntries } =
    useToggleSet<number>();

  const { page, setPage, totalPages, offset } = usePagination(
    changelog.length,
    SITE_PAGE_SIZE,
    String(changelog.length)
  );
  const paginatedChangelog = changelog.slice(offset, offset + SITE_PAGE_SIZE);

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <div>
          <Title order={1}>Changelog</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Track updates to the Dragon Traveler Wiki
          </Text>
        </div>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="site">Site Updates</Tabs.Tab>
            <Tabs.Tab value="data">Data History</Tabs.Tab>
          </Tabs.List>

          {/* ── Site Updates tab ── */}
          <Tabs.Panel value="site" pt="md">
            <Stack gap="lg">
              {loading && <ListPageLoading cards={4} />}

              {!loading && changelog.length === 0 && (
                <Text c="dimmed" ta="center" py="lg">
                  No changelog entries available yet.
                </Text>
              )}

              {!loading && changelog.length > 0 && (
                <>
                  <Timeline active={-1} bulletSize={28} lineWidth={2}>
                    {paginatedChangelog.map((entry, entryIndex) => {
                      const entryId = offset + entryIndex;
                      const isExpanded = expandedEntries.has(entryId);

                      const categories = [
                        ...new Set(entry.changes.map((c) => c.category)),
                      ];
                      const byCategory = categories.map((cat) => ({
                        category: cat,
                        changes: entry.changes.filter((c) => c.category === cat),
                      }));

                      return (
                        <Timeline.Item
                          key={entry.date}
                          color={accent.primary}
                          bullet={<IoCheckmarkCircle size={18} />}
                          title={
                            <Group
                              justify="space-between"
                              wrap="wrap"
                              gap="xs"
                              align="center"
                            >
                              <Group gap="xs" wrap="wrap" align="center">
                                <Text fw={600} size="sm">
                                  {formatShortDate(new Date(entry.date))}
                                </Text>
                                {entry.version && (
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color={accent.primary}
                                  >
                                    v{entry.version}
                                  </Badge>
                                )}
                                <Badge size="xs" variant="light" color="gray">
                                  {entry.changes.length} change
                                  {entry.changes.length !== 1 ? 's' : ''}
                                </Badge>
                              </Group>
                              <Button
                                size="compact-xs"
                                variant="subtle"
                                color={accent.primary}
                                onClick={() => toggleEntry(entryId)}
                              >
                                {isExpanded ? 'Minimize' : 'Expand'}
                              </Button>
                            </Group>
                          }
                        >
                          <Collapse in={isExpanded}>
                            <Paper p="sm" withBorder radius="md" mt="xs">
                              <Stack gap={6}>
                                {byCategory.map(({ category, changes }) => (
                                  <Paper
                                    key={category}
                                    p="xs"
                                    withBorder
                                    radius="sm"
                                    bg="var(--mantine-color-default)"
                                  >
                                    <Group gap="xs" align="center" mb={6}>
                                      <Badge
                                        size="xs"
                                        variant="light"
                                        color={accent.secondary}
                                      >
                                        {category}
                                      </Badge>
                                    </Group>
                                    <Stack gap={4}>
                                      {changes.map((change, i) => (
                                        <Group
                                          key={i}
                                          gap="xs"
                                          wrap="nowrap"
                                          align="flex-start"
                                        >
                                          <Badge
                                            size="xs"
                                            variant="dot"
                                            color={CHANGE_TYPE_COLORS[change.type]}
                                            style={{ flexShrink: 0, marginTop: 2 }}
                                          >
                                            {capitalize(change.type)}
                                          </Badge>
                                          <Text size="sm">
                                            {change.description}
                                          </Text>
                                        </Group>
                                      ))}
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>
                            </Paper>
                          </Collapse>
                        </Timeline.Item>
                      );
                    })}
                  </Timeline>

                  <PaginationControl
                    currentPage={page}
                    totalPages={totalPages}
                    onChange={(p) => {
                      setPage(p);
                      clearEntries();
                    }}
                    scrollToTop
                  />
                </>
              )}

              <Paper
                p="md"
                radius="md"
                withBorder
                {...getCardHoverProps({
                  style: { marginTop: 'var(--mantine-spacing-xl)' },
                })}
              >
                <Text size="sm" c="dimmed" ta="center">
                  This changelog tracks major updates to the wiki database. For
                  site improvements and bug fixes, check the GitHub repository.
                </Text>
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* ── Data History tab ── */}
          <Tabs.Panel value="data" pt="md">
            <DataHistory />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
