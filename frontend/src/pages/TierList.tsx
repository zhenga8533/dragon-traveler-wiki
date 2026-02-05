import {
  Accordion,
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
import { IoAddCircleOutline, IoFilter } from 'react-icons/io5';
import CharacterCard from '../components/CharacterCard';
import CharacterFilter from '../components/CharacterFilter';
import TierListBuilder from '../components/TierListBuilder';
import { TIER_COLOR, TIER_ORDER } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { TierList as TierListType } from '../types/tier-list';
import type { CharacterFilters } from '../utils/filter-characters';
import { EMPTY_FILTERS, extractAllEffectRefs, filterCharacters } from '../utils/filter-characters';
import { TIER_LIST_SUGGEST_URL } from '../utils/github-issues';

export default function TierList() {
  const { data: tierLists, loading: loadingTiers } = useDataFetch<TierListType[]>(
    'data/tier-lists.json',
    [],
  );
  const { data: characters, loading: loadingChars } = useDataFetch<Character[]>(
    'data/characters.json',
    [],
  );
  const [filters, setFilters] = useState<CharacterFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [mode, setMode] = useState<'view' | 'builder'>('view');
  const loading = loadingTiers || loadingChars;

  const effectOptions = useMemo(() => extractAllEffectRefs(characters), [characters]);

  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(c.name, c);
    return map;
  }, [characters]);

  const filteredNames = useMemo(() => {
    const filtered = filterCharacters(characters, filters);
    return new Set(filtered.map((c) => c.name));
  }, [characters, filters]);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.qualities.length +
    filters.classes.length +
    filters.factions.length +
    filters.statusEffects.length;

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
            <Button
              component="a"
              href={TIER_LIST_SUGGEST_URL}
              target="_blank"
              variant="light"
              size="xs"
              leftSection={<IoAddCircleOutline size={16} />}
            >
              Suggest a Tier List
            </Button>
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
              onChange={(val) => setMode(val as 'view' | 'builder')}
              data={[
                { label: 'View Tier Lists', value: 'view' },
                { label: 'Create Your Own', value: 'builder' },
              ]}
            />

            <Collapse in={filterOpen}>
              <Paper p="md" radius="md" withBorder>
                <CharacterFilter
                  filters={filters}
                  onChange={setFilters}
                  effectOptions={effectOptions}
                />
              </Paper>
            </Collapse>

            {mode === 'view' && (
              <Tabs defaultValue={tierLists[0]?.name}>
                <Tabs.List>
                  {tierLists.map((tierList) => (
                    <Tabs.Tab key={tierList.name} value={tierList.name}>
                      {tierList.name}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>

                {tierLists.map((tierList) => (
                  <Tabs.Panel key={tierList.name} value={tierList.name} pt="md">
                    <Stack gap="md">
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">By {tierList.author}</Text>
                        {tierList.description && (
                          <>
                            <Text size="sm" c="dimmed">•</Text>
                            <Text size="sm" c="dimmed">{tierList.description}</Text>
                          </>
                        )}
                      </Group>

                      <Accordion variant="separated" defaultValue={tierList.categories[0]?.name}>
                        {tierList.categories.map((cat) => {
                          const visibleEntries = cat.entries.filter((e) => filteredNames.has(e.character_name));
                          const byTier = TIER_ORDER.map((tier) => ({
                            tier,
                            entries: visibleEntries.filter((e) => e.tier === tier),
                          })).filter((g) => g.entries.length > 0);

                          return (
                            <Accordion.Item key={cat.name} value={cat.name}>
                              <Accordion.Control>
                                <Group gap="sm">
                                  <Text fw={600}>{cat.name}</Text>
                                  <Badge size="sm" variant="light">
                                    {visibleEntries.length} characters
                                  </Badge>
                                </Group>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Stack gap="md">
                                  {cat.description && (
                                    <Text size="sm" c="dimmed">{cat.description}</Text>
                                  )}

                                  {visibleEntries.length === 0 && (
                                    <Text c="dimmed" size="sm" ta="center" py="md">
                                      No characters match the current filters.
                                    </Text>
                                  )}

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
                                        <SimpleGrid cols={{ base: 4, xs: 5, sm: 6, md: 8 }} spacing={4}>
                                          {entries.map((entry) => {
                                            const char = charMap.get(entry.character_name);
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
                                </Stack>
                              </Accordion.Panel>
                            </Accordion.Item>
                          );
                        })}
                      </Accordion>
                    </Stack>
                  </Tabs.Panel>
                ))}
              </Tabs>
            )}

            {mode === 'builder' && (
              <TierListBuilder
                characters={characters}
                filteredNames={filteredNames}
                charMap={charMap}
              />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
