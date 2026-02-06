import {
  Badge,
  Button,
  Center,
  Collapse,
  Container,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import { IoCreate, IoFilter } from 'react-icons/io5';
import CharacterCard from '../components/CharacterCard';
import type { ChipFilterGroup } from '../components/EntityFilter';
import EntityFilter from '../components/EntityFilter';
import SuggestModal from '../components/SuggestModal';
import TierListBuilder from '../components/TierListBuilder';
import { TIER_COLOR, TIER_ORDER } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { TierList as TierListType } from '../types/tier-list';
import { TIER_LIST_JSON_TEMPLATE } from '../utils/github-issues';

export default function TierList() {
  const { data: tierLists, loading: loadingTiers } = useDataFetch<
    TierListType[]
  >('data/tier-lists.json', []);
  const { data: characters, loading: loadingChars } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const [viewFilters, setViewFilters] = useState<Record<string, string[]>>({
    contentTypes: [],
  });
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [mode, setMode] = useState<'view' | 'builder'>('view');
  const [editData, setEditData] = useState<TierListType | null>(null);
  const loading = loadingTiers || loadingChars;

  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(c.name, c);
    return map;
  }, [characters]);

  const contentTypeOptions = useMemo(
    () => [...new Set(tierLists.map((t) => t.content_type))].sort(),
    [tierLists]
  );

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
    mode === 'view' ? viewFilters.contentTypes.length : 0;

  const visibleTierLists = useMemo(() => {
    if (viewFilters.contentTypes.length === 0) return tierLists;
    return tierLists.filter((tl) =>
      viewFilters.contentTypes.includes(tl.content_type)
    );
  }, [tierLists, viewFilters]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Tier List</Title>
          <Group gap="xs">
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
            <SuggestModal
              buttonLabel="Suggest a Tier List"
              modalTitle="Suggest a New Tier List"
              jsonTemplate={TIER_LIST_JSON_TEMPLATE}
              issueLabel="tier-list"
              issueTitle="[Tier List] New tier list suggestion"
            />
          </Group>
        </Group>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && (
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
                <Paper p="md" radius="md" withBorder>
                  <EntityFilter
                    groups={entityFilterGroups}
                    selected={viewFilters}
                    onChange={(key, values) =>
                      setViewFilters((prev) => ({ ...prev, [key]: values }))
                    }
                    onClear={() => setViewFilters({ contentTypes: [] })}
                  />
                </Paper>
              </Collapse>
            )}

            {mode === 'view' && (
              <>
                {visibleTierLists.length === 0 && (
                  <Text c="dimmed" ta="center" py="lg">
                    No tier lists match the current filters.
                  </Text>
                )}

                {visibleTierLists.length > 0 && (
                  <Tabs defaultValue={visibleTierLists[0]?.name}>
                    <Tabs.List style={{ flexWrap: 'wrap' }}>
                      {visibleTierLists.map((tierList) => (
                        <Tabs.Tab key={tierList.name} value={tierList.name}>
                          {tierList.name}
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>

                    {visibleTierLists.map((tierList) => {
                      const byTier = TIER_ORDER.map((tier) => ({
                        tier,
                        entries: tierList.entries.filter(
                          (e) => e.tier === tier
                        ),
                      })).filter((g) => g.entries.length > 0);

                      const rankedNames = new Set(
                        tierList.entries.map((e) => e.character_name)
                      );
                      const unranked = characters.filter(
                        (c) => !rankedNames.has(c.name)
                      );

                      return (
                        <Tabs.Panel
                          key={tierList.name}
                          value={tierList.name}
                          pt="md"
                        >
                          <Stack gap="md">
                            <Group gap="xs">
                              <Badge variant="light" size="sm">
                                {tierList.content_type}
                              </Badge>
                              <Text size="sm" c="dimmed">
                                By {tierList.author}
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
                              <Button
                                variant="subtle"
                                size="compact-xs"
                                leftSection={<IoCreate size={14} />}
                                onClick={() => {
                                  setEditData(tierList);
                                  setMode('builder');
                                }}
                              >
                                Edit
                              </Button>
                            </Group>

                            {byTier.map(({ tier, entries }) => (
                              <Paper key={tier} p="md" radius="md" withBorder>
                                <Stack gap="sm">
                                  <Badge
                                    variant="filled"
                                    color={TIER_COLOR[tier]}
                                    size="lg"
                                    radius="sm"
                                  >
                                    {tier} Tier
                                  </Badge>
                                  <SimpleGrid
                                    cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                                    spacing={4}
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
                                        />
                                      );
                                    })}
                                  </SimpleGrid>
                                </Stack>
                              </Paper>
                            ))}

                            {unranked.length > 0 && (
                              <Paper p="md" radius="md" withBorder>
                                <Stack gap="sm">
                                  <Badge
                                    variant="filled"
                                    color="gray"
                                    size="lg"
                                    radius="sm"
                                  >
                                    Unranked
                                  </Badge>
                                  <SimpleGrid
                                    cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                                    spacing={4}
                                  >
                                    {unranked.map((c) => (
                                      <CharacterCard
                                        key={c.name}
                                        name={c.name}
                                        quality={c.quality}
                                      />
                                    ))}
                                  </SimpleGrid>
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
