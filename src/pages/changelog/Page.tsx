import { ChangeRecordCard } from '@/components/common/ChangeHistory';
import EntityFilter from '@/components/common/EntityFilter';
import {
  FilterChipGroup,
  FilterSection,
} from '@/components/common/FilterControls';
import { ListPageLoading } from '@/components/layout/PageLoadingSkeleton';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import PaginationControl from '@/components/ui/PaginationControl';
import { IMAGE_SIZE } from '@/constants/ui';
import { useChangelog } from '@/features/wiki/hooks/use-wiki-data';
import {
  useFilterPanel,
  useGradientAccent,
  usePageSize,
  useTabParam,
} from '@/hooks';
import { getPageSizeStorageKey, usePagination } from '@/hooks/use-pagination';
import { LocaleContext } from '@/contexts/locale';
import { changesPath, dataPath } from '@/utils/data-paths';
import type { SupportedLocale } from '@/utils/data-paths';
import type { ChangesFile, FieldDiff } from '@/types/changes';
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
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  IoAddCircle,
  IoCheckmarkCircle,
  IoCloseCircle,
} from 'react-icons/io5';

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
const CHANGELOG_PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

// ─── Data changes types ───────────────────────────────────────────────────────

interface DataEvent {
  id: string;
  timestamp: number;
  entityId: string;
  entityName: string;
  category: string;
  categoryLabel: string;
  eventType: 'updated' | 'removed' | 'readded';
  fields?: Record<string, FieldDiff>;
}

// ─── Known change files ───────────────────────────────────────────────────────
// Keep in sync with LOCALE_FILE_SET / GLOBAL_FILE_SET in utils/data-paths.ts.

const DATA_FILES: { file: string; label: string }[] = [
  { file: 'characters', label: 'Characters' },
  { file: 'artifacts', label: 'Artifacts' },
  { file: 'tier-lists', label: 'Tier Lists' },
  { file: 'teams', label: 'Teams' },
  { file: 'noble-phantasm', label: 'Noble Phantasms' },
  { file: 'relic', label: 'Relics' },
  { file: 'golden-alliances', label: 'Golden Alliances' },
  { file: 'codes', label: 'Codes' },
  { file: 'events', label: 'Events' },
  { file: 'factions', label: 'Factions' },
  { file: 'gear', label: 'Gear' },
  { file: 'gear-sets', label: 'Gear Sets' },
  { file: 'howlkins', label: 'Howlkins' },
  { file: 'resources', label: 'Resources' },
  { file: 'status-effects', label: 'Status Effects' },
  { file: 'subclasses', label: 'Subclasses' },
  { file: 'wyrms', label: 'Wyrms' },
  { file: 'wyrmspells', label: 'Wyrmspells' },
  { file: 'useful-links', label: 'Useful Links' },
];

// Categories keyed by `slug` in their changes file, with a separate `name` field
// in their data file to resolve for display. Categories not listed here (teams,
// tier-lists, codes, useful-links) are already keyed by their display identifier.
const SLUG_KEYED_FILES = new Set([
  'characters',
  'artifacts',
  'noble-phantasm',
  'relic',
  'golden-alliances',
  'events',
  'factions',
  'gear',
  'gear-sets',
  'howlkins',
  'resources',
  'status-effects',
  'subclasses',
  'wyrms',
  'wyrmspells',
]);

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

function formatEntityName(entityId: string): string {
  if (entityId.includes('__')) {
    return entityId.slice(0, entityId.indexOf('__'));
  }
  return entityId;
}

/** Fetches `{slug, name}` records for a category and maps slug → name, if applicable. */
async function fetchSlugNameMap(
  base: string,
  file: string,
  locale: SupportedLocale
): Promise<Map<string, string> | null> {
  if (!SLUG_KEYED_FILES.has(file)) return null;
  try {
    const res = await fetch(`${base}${dataPath(`${file}.json`, locale)}`);
    if (!res.ok) return null;
    const entities: { slug?: string; name?: string }[] = await res.json();
    const map = new Map<string, string>();
    for (const entity of entities) {
      if (entity.slug && entity.name) map.set(entity.slug, entity.name);
    }
    return map;
  } catch {
    return null;
  }
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
  const { locale } = useContext(LocaleContext);
  const [events, setEvents] = useState<DataEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const {
    set: expandedIds,
    toggle: toggleExpanded,
    clear: clearExpanded,
  } = useToggleSet<string>();

  useEffect(() => {
    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) setLoading(true);
    });
    const base = import.meta.env.BASE_URL ?? '/';
    Promise.all(
      DATA_FILES.map(async ({ file, label }) => {
        try {
          const [changesRes, nameMap] = await Promise.all([
            fetch(`${base}${changesPath(`${file}.json`, locale)}`),
            fetchSlugNameMap(base, file, locale),
          ]);
          if (!changesRes.ok) return { events: [] as DataEvent[] };
          const data: ChangesFile = await changesRes.json();

          const out: DataEvent[] = [];
          for (const [entityId, entity] of Object.entries(data)) {
            const slug = formatEntityName(entityId);
            const entityName = nameMap?.get(slug) ?? slug;
            entity.changes.forEach((change, i) => {
              out.push({
                id: `${file}__${entityId}__${i}`,
                timestamp: change.timestamp,
                entityId,
                entityName,
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
          return { events: out };
        } catch {
          return { events: [] as DataEvent[] };
        }
      })
    ).then((results) => {
      if (isCancelled) return;
      const all = results
        .flatMap((r) => r.events)
        .sort((a, b) => b.timestamp - a.timestamp);
      setEvents(all);
      setLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [locale]);

  const filtered =
    selectedCategories.length === 0
      ? events
      : events.filter((e) => selectedCategories.includes(e.category));

  const filterKey = selectedCategories.join(',');
  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    CHANGELOG_PAGE_SIZE_OPTIONS,
    {
      defaultSize: DATA_PAGE_SIZE,
      storageKey: getPageSizeStorageKey('changelog:data'),
    }
  );

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    pageSize,
    filterKey
  );
  useEffect(() => {
    setPage(1);
  }, [pageSize, setPage]);
  const pageItems = filtered.slice(offset, offset + pageSize);

  const categoryChipOptions = DATA_FILES.filter(({ file }) =>
    events.some((e) => e.category === file)
  ).map(({ file, label }) => ({ value: file, label }));

  function clearFilters() {
    setSelectedCategories([]);
    clearExpanded();
  }

  const filterContent = (
    <EntityFilter
      onClear={clearFilters}
      hasActiveFilters={selectedCategories.length > 0}
      afterGroups={
        <FilterSection label="Category">
          <FilterChipGroup
            value={selectedCategories}
            onChange={(values) => {
              setSelectedCategories(values);
              clearExpanded();
            }}
            options={categoryChipOptions}
          />
        </FilterSection>
      }
    />
  );

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
        <FilterPopoverButton
          filterCount={selectedCategories.length}
          filterOpen={filterOpen}
          onFilterToggle={toggleFilter}
        >
          {filterContent}
        </FilterPopoverButton>
      </Group>

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
                      <IoCloseCircle size={IMAGE_SIZE.ICON_LG} />
                    ) : event.eventType === 'readded' ? (
                      <IoAddCircle size={IMAGE_SIZE.ICON_LG} />
                    ) : (
                      <IoCheckmarkCircle size={IMAGE_SIZE.ICON_LG} />
                    )
                  }
                  title={
                    <Group justify="space-between" wrap="wrap" gap="xs">
                      <Group gap="xs" wrap="wrap">
                        <Text fw={600} size="sm">
                          {event.entityName}
                        </Text>
                        <Badge
                          size="xs"
                          variant="light"
                          color={accent.secondary}
                        >
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
            totalItems={filtered.length}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={setPageSize}
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
  const { data: changelog, loading } = useChangelog() as { data: ChangelogEntry[]; loading: boolean };
  const [activeTab, handleTabChange] = useTabParam('tab', 'site', [
    'site',
    'data',
  ]);
  const {
    set: expandedEntries,
    toggle: toggleEntry,
    clear: clearEntries,
  } = useToggleSet<number>();

  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    CHANGELOG_PAGE_SIZE_OPTIONS,
    {
      defaultSize: SITE_PAGE_SIZE,
      storageKey: getPageSizeStorageKey('changelog:site'),
    }
  );

  const { page, setPage, totalPages, offset } = usePagination(
    changelog.length,
    pageSize,
    String(changelog.length)
  );
  useEffect(() => {
    setPage(1);
  }, [pageSize, setPage]);
  const paginatedChangelog = changelog.slice(offset, offset + pageSize);

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
                        changes: entry.changes.filter(
                          (c) => c.category === cat
                        ),
                      }));

                      return (
                        <Timeline.Item
                          key={entry.date}
                          color={accent.primary}
                          bullet={
                            <IoCheckmarkCircle size={IMAGE_SIZE.ICON_LG} />
                          }
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
                                      {changes.map((change) => (
                                        <Group
                                          key={`${change.type}-${change.description}`}
                                          gap="xs"
                                          wrap="nowrap"
                                          align="flex-start"
                                        >
                                          <Badge
                                            size="xs"
                                            variant="dot"
                                            color={
                                              CHANGE_TYPE_COLORS[change.type]
                                            }
                                            style={{
                                              flexShrink: 0,
                                              marginTop: 2,
                                            }}
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
                    totalItems={changelog.length}
                    pageSize={pageSize}
                    pageSizeOptions={pageSizeOptions}
                    onPageSizeChange={setPageSize}
                    scrollToTop
                  />
                </>
              )}
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
