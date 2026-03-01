import {
  Badge,
  Button,
  Collapse,
  Container,
  Group,
  Paper,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { IoCreate, IoFilter } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import CharacterCard from '../components/character/CharacterCard';
import CharacterPortrait from '../components/character/CharacterPortrait';
import ClassTag from '../components/common/ClassTag';
import DataFetchError from '../components/common/DataFetchError';
import type { ChipFilterGroup } from '../components/common/EntityFilter';
import EntityFilter from '../components/common/EntityFilter';
import FactionTag from '../components/common/FactionTag';
import LastUpdated from '../components/common/LastUpdated';
import NoResultsSuggestions from '../components/common/NoResultsSuggestions';
import QualityIcon from '../components/common/QualityIcon';
import ViewToggle from '../components/common/ViewToggle';
import {
  ListPageLoading,
  ViewModeLoading,
} from '../components/layout/PageLoadingSkeleton';
import TierListBuilder from '../components/tools/TierListBuilder';
import { getTierColor, TIER_ORDER } from '../constants/colors';
import {
  CONTENT_TYPE_OPTIONS,
  normalizeContentType,
} from '../constants/content-types';
import { getCardHoverProps } from '../constants/styles';
import { CHARACTER_GRID_SPACING, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks';
import { useFilters, useViewMode } from '../hooks/use-filters';
import type { Character } from '../types/character';
import type { TierList as TierListType } from '../types/tier-list';
import { sortCharactersByQuality } from '../utils/filter-characters';

export default function TierList() {
  const {
    data: tierLists,
    loading: loadingTiers,
    error: tierListsError,
  } = useDataFetch<TierListType[]>('data/tier-lists.json', []);
  const {
    data: characters,
    loading: loadingChars,
    error: charactersError,
  } = useDataFetch<Character[]>('data/characters.json', []);
  const { filters: viewFilters, setFilters: setViewFilters } = useFilters<
    Record<string, string[]>
  >({
    emptyFilters: { contentTypes: [] },
    storageKey: STORAGE_KEY.TIER_LIST_FILTERS,
  });
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(STORAGE_KEY.TIER_LIST_SEARCH) || '';
  });
  const [mode, setMode] = useState<'view' | 'builder'>('view');
  const [editData, setEditData] = useState<TierListType | null>(null);
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TIER_LIST_VIEW_MODE,
    defaultMode: 'grid',
  });
  const loading = loadingTiers || loadingChars;
  const error = tierListsError || charactersError;

  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(c.name, c);
    return map;
  }, [characters]);

  const contentTypeOptions = useMemo(() => [...CONTENT_TYPE_OPTIONS], []);

  useEffect(() => {
    const normalized = viewFilters.contentTypes.map((value) =>
      normalizeContentType(value, 'All')
    );
    const deduped = [...new Set(normalized)];
    const unchanged =
      deduped.length === viewFilters.contentTypes.length &&
      deduped.every(
        (value, index) => value === viewFilters.contentTypes[index]
      );
    if (unchanged) return;
    setViewFilters((prev) => ({ ...prev, contentTypes: deduped }));
  }, [viewFilters.contentTypes, setViewFilters]);

  const entityFilterGroups: ChipFilterGroup[] = useMemo(
    () => [
      {
        key: 'contentTypes',
        label: 'Content Type',
        options: contentTypeOptions,
      },
    ],
    [contentTypeOptions]
  );

  const activeFilterCount =
    mode === 'view'
      ? viewFilters.contentTypes.length + (search.trim() ? 1 : 0)
      : 0;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY.TIER_LIST_SEARCH, search);
  }, [search]);

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const tl of tierLists) {
      if (tl.last_updated > latest) latest = tl.last_updated;
    }
    return latest;
  }, [tierLists]);

  const visibleTierLists = useMemo(() => {
    return tierLists.filter((tl) => {
      if (
        search &&
        ![tl.name, tl.author, tl.description ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;

      if (
        viewFilters.contentTypes.length > 0 &&
        !viewFilters.contentTypes.includes(
          normalizeContentType(tl.content_type, 'All')
        )
      )
        return false;

      return true;
    });
  }, [tierLists, search, viewFilters]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Tier List</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <Group gap="xs">
            {mode === 'view' && (
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            )}
            {mode === 'view' && (
              <Button
                variant="default"
                size="xs"
                leftSection={<IoFilter size={16} />}
                rightSection={
                  activeFilterCount > 0 ? (
                    <Badge size="xs" circle variant="filled">
                      {activeFilterCount}
                    </Badge>
                  ) : null
                }
                onClick={toggleFilter}
              >
                Filters
              </Button>
            )}
          </Group>
        </Group>

        {loading &&
          (mode === 'view' ? (
            <ViewModeLoading viewMode={viewMode} cards={3} cardHeight={180} />
          ) : (
            <ListPageLoading cards={3} />
          ))}

        {!loading && error && (
          <DataFetchError
            title="Could not load tier lists"
            message={error.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && (
          <>
            <SegmentedControl
              value={mode}
              onChange={(val) => {
                setMode(val as 'view' | 'builder');
                if (val === 'view') setEditData(null);
              }}
              data={[
                { label: 'View Tier Lists', value: 'view' },
                { label: 'Create Your Own', value: 'builder' },
              ]}
            />

            {mode === 'view' && (
              <Collapse in={filterOpen}>
                <Paper
                  p="sm"
                  radius="md"
                  withBorder
                  {...getCardHoverProps()}
                  bg="var(--mantine-color-body)"
                >
                  <EntityFilter
                    groups={entityFilterGroups}
                    selected={viewFilters}
                    onChange={(key, values) =>
                      setViewFilters((prev) => ({ ...prev, [key]: values }))
                    }
                    onClear={() => {
                      setViewFilters({ contentTypes: [] });
                      setSearch('');
                    }}
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search tier lists..."
                  />
                </Paper>
              </Collapse>
            )}

            {mode === 'view' && (
              <>
                {visibleTierLists.length === 0 && (
                  <NoResultsSuggestions
                    title="No tier lists found"
                    message="No tier lists match the current filters."
                    onReset={() => {
                      setViewFilters({ contentTypes: [] });
                      setSearch('');
                    }}
                    onOpenFilters={toggleFilter}
                  />
                )}

                {visibleTierLists.length > 0 && (
                  <Tabs defaultValue={visibleTierLists[0]?.name}>
                    <Group justify="space-between" mb="md" wrap="wrap">
                      <Tabs.List style={{ flexWrap: 'wrap', flex: 1 }}>
                        {visibleTierLists.map((tierList) => (
                          <Tabs.Tab key={tierList.name} value={tierList.name}>
                            {tierList.name}
                          </Tabs.Tab>
                        ))}
                      </Tabs.List>
                    </Group>

                    {visibleTierLists.map((tierList) => {
                      const tierOrder =
                        tierList.tiers?.map((t) => t.name) ?? TIER_ORDER;
                      const definedTierSet = new Set(tierOrder);
                      const extraTiers = [
                        ...new Set(tierList.entries.map((e) => e.tier)),
                      ].filter((t) => !definedTierSet.has(t));
                      const allTierOrder = [...tierOrder, ...extraTiers];

                      const byTier = allTierOrder
                        .map((tier, tierIndex) => ({
                          tier,
                          tierIndex,
                          note: tierList.tiers?.find((t) => t.name === tier)
                            ?.note,
                          entries: tierList.entries.filter(
                            (e) => e.tier === tier
                          ),
                        }))
                        .filter((g) => g.entries.length > 0);

                      const rankedNames = new Set(
                        tierList.entries.map((e) => e.character_name)
                      );
                      const unranked = sortCharactersByQuality(
                        characters.filter((c) => !rankedNames.has(c.name))
                      );

                      return (
                        <Tabs.Panel
                          key={tierList.name}
                          value={tierList.name}
                          pt="md"
                        >
                          <Stack gap="md">
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={0}>
                                <Group gap="xs" wrap="wrap">
                                  <Badge variant="light" size="sm">
                                    {normalizeContentType(
                                      tierList.content_type,
                                      'All'
                                    )}
                                  </Badge>
                                  <Text size="sm" c="dimmed">
                                    by{' '}
                                    <Text span c="violet" inherit>
                                      {tierList.author}
                                    </Text>
                                  </Text>
                                  {tierList.description && (
                                    <>
                                      <Text size="sm" c="dimmed">
                                        •
                                      </Text>
                                      <Text size="sm" c="dimmed">
                                        {tierList.description}
                                      </Text>
                                    </>
                                  )}
                                </Group>
                                <LastUpdated
                                  timestamp={tierList.last_updated}
                                />
                              </Stack>
                              <Button
                                variant="light"
                                size="sm"
                                leftSection={<IoCreate size={14} />}
                                onClick={() => {
                                  setEditData(tierList);
                                  setMode('builder');
                                }}
                              >
                                Edit
                              </Button>
                            </Group>

                            {byTier.map(
                              ({ tier, tierIndex, note, entries }) => (
                                <Paper
                                  key={tier}
                                  p="md"
                                  radius="md"
                                  withBorder
                                  {...getCardHoverProps()}
                                >
                                  <Stack gap="sm">
                                    <Stack gap={4}>
                                      <Badge
                                        variant="filled"
                                        color={getTierColor(tier, tierIndex)}
                                        size="lg"
                                        radius="sm"
                                      >
                                        {tier} Tier
                                      </Badge>
                                      {note && (
                                        <Text size="xs" c="dimmed">
                                          {note}
                                        </Text>
                                      )}
                                    </Stack>
                                    {viewMode === 'grid' ? (
                                      <SimpleGrid
                                        cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                                        spacing={CHARACTER_GRID_SPACING}
                                      >
                                        {entries.map((entry) => {
                                          const char = charMap.get(
                                            entry.character_name
                                          );
                                          return (
                                            <CharacterCard
                                              key={entry.character_name}
                                              name={entry.character_name}
                                              quality={char?.quality}
                                              note={entry.note}
                                              noteIconVariant="builder"
                                            />
                                          );
                                        })}
                                      </SimpleGrid>
                                    ) : (
                                      <ScrollArea
                                        type="auto"
                                        scrollbarSize={6}
                                        offsetScrollbars
                                      >
                                        <Table
                                          striped
                                          highlightOnHover
                                          style={{ minWidth: 460 }}
                                        >
                                          <Table.Thead>
                                            <Table.Tr>
                                              <Table.Th>Character</Table.Th>
                                              <Table.Th>Quality</Table.Th>
                                              <Table.Th>Class</Table.Th>
                                              <Table.Th>Factions</Table.Th>
                                              <Table.Th>Note</Table.Th>
                                            </Table.Tr>
                                          </Table.Thead>
                                          <Table.Tbody>
                                            {entries.map((entry) => {
                                              const char = charMap.get(
                                                entry.character_name
                                              );
                                              return (
                                                <Table.Tr
                                                  key={entry.character_name}
                                                >
                                                  <Table.Td>
                                                    <Group
                                                      gap="sm"
                                                      wrap="nowrap"
                                                    >
                                                      <CharacterPortrait
                                                        name={
                                                          entry.character_name
                                                        }
                                                        size={32}
                                                        quality={char?.quality}
                                                      />
                                                      <Text
                                                        component={Link}
                                                        to={`/characters/${encodeURIComponent(entry.character_name)}`}
                                                        size="sm"
                                                        fw={500}
                                                        c="violet"
                                                      >
                                                        {entry.character_name}
                                                      </Text>
                                                    </Group>
                                                  </Table.Td>
                                                  <Table.Td>
                                                    {char ? (
                                                      <QualityIcon
                                                        quality={char.quality}
                                                        size={18}
                                                      />
                                                    ) : (
                                                      <Text
                                                        size="sm"
                                                        c="dimmed"
                                                      >
                                                        —
                                                      </Text>
                                                    )}
                                                  </Table.Td>
                                                  <Table.Td>
                                                    {char ? (
                                                      <ClassTag
                                                        characterClass={
                                                          char.character_class
                                                        }
                                                        size="sm"
                                                      />
                                                    ) : (
                                                      <Text
                                                        size="sm"
                                                        c="dimmed"
                                                      >
                                                        —
                                                      </Text>
                                                    )}
                                                  </Table.Td>
                                                  <Table.Td>
                                                    {char &&
                                                    char.factions.length > 0 ? (
                                                      <Group
                                                        gap={4}
                                                        wrap="wrap"
                                                      >
                                                        {char.factions.map(
                                                          (faction) => (
                                                            <FactionTag
                                                              key={faction}
                                                              faction={faction}
                                                              size="xs"
                                                            />
                                                          )
                                                        )}
                                                      </Group>
                                                    ) : (
                                                      <Text
                                                        size="sm"
                                                        c="dimmed"
                                                      >
                                                        —
                                                      </Text>
                                                    )}
                                                  </Table.Td>
                                                  <Table.Td>
                                                    <Text size="sm" c="dimmed">
                                                      {entry.note || '—'}
                                                    </Text>
                                                  </Table.Td>
                                                </Table.Tr>
                                              );
                                            })}
                                          </Table.Tbody>
                                        </Table>
                                      </ScrollArea>
                                    )}
                                  </Stack>
                                </Paper>
                              )
                            )}

                            {unranked.length > 0 && (
                              <Paper
                                p="md"
                                radius="md"
                                withBorder
                                {...getCardHoverProps()}
                              >
                                <Stack gap="sm">
                                  <Badge
                                    variant="filled"
                                    color="gray"
                                    size="lg"
                                    radius="sm"
                                  >
                                    Unranked
                                  </Badge>
                                  {viewMode === 'grid' ? (
                                    <SimpleGrid
                                      cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                                      spacing={CHARACTER_GRID_SPACING}
                                    >
                                      {unranked.map((c) => (
                                        <CharacterCard
                                          key={c.name}
                                          name={c.name}
                                          quality={c.quality}
                                        />
                                      ))}
                                    </SimpleGrid>
                                  ) : (
                                    <ScrollArea
                                      type="auto"
                                      scrollbarSize={6}
                                      offsetScrollbars
                                    >
                                      <Table
                                        striped
                                        highlightOnHover
                                        style={{ minWidth: 460 }}
                                      >
                                        <Table.Thead>
                                          <Table.Tr>
                                            <Table.Th>Character</Table.Th>
                                            <Table.Th>Quality</Table.Th>
                                            <Table.Th>Class</Table.Th>
                                            <Table.Th>Factions</Table.Th>
                                          </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                          {unranked.map((c) => (
                                            <Table.Tr key={c.name}>
                                              <Table.Td>
                                                <Group gap="sm" wrap="nowrap">
                                                  <CharacterPortrait
                                                    name={c.name}
                                                    size={32}
                                                    quality={c.quality}
                                                  />
                                                  <Text
                                                    component={Link}
                                                    to={`/characters/${encodeURIComponent(c.name)}`}
                                                    size="sm"
                                                    fw={500}
                                                    c="violet"
                                                  >
                                                    {c.name}
                                                  </Text>
                                                </Group>
                                              </Table.Td>
                                              <Table.Td>
                                                <QualityIcon
                                                  quality={c.quality}
                                                  size={18}
                                                />
                                              </Table.Td>
                                              <Table.Td>
                                                <ClassTag
                                                  characterClass={
                                                    c.character_class
                                                  }
                                                  size="sm"
                                                />
                                              </Table.Td>
                                              <Table.Td>
                                                <Group gap={4} wrap="wrap">
                                                  {c.factions.map((faction) => (
                                                    <FactionTag
                                                      key={faction}
                                                      faction={faction}
                                                      size="xs"
                                                    />
                                                  ))}
                                                </Group>
                                              </Table.Td>
                                            </Table.Tr>
                                          ))}
                                        </Table.Tbody>
                                      </Table>
                                    </ScrollArea>
                                  )}
                                </Stack>
                              </Paper>
                            )}
                          </Stack>
                        </Tabs.Panel>
                      );
                    })}
                  </Tabs>
                )}
              </>
            )}

            {mode === 'builder' && (
              <TierListBuilder
                characters={characters}
                charMap={charMap}
                initialData={editData}
              />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
