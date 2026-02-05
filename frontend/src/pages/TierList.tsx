import {
  Badge,
  Button,
  Center,
  Collapse,
  Container,
  Group,
  Image,
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
import { getPortrait } from '../assets/portrait';
import CharacterFilter from '../components/CharacterFilter';
import TierListBuilder from '../components/TierListBuilder';
import { GITHUB_REPO_URL } from '../constants';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { Tier, TierListCategory } from '../types/tier-list';
import type { CharacterFilters } from '../utils/filter-characters';
import { EMPTY_FILTERS, extractAllEffectRefs, filterCharacters } from '../utils/filter-characters';

const SUGGEST_URL =
  `${GITHUB_REPO_URL}/issues/new?` +
  new URLSearchParams({
    title: '[Tier List] New tier list suggestion',
    body: [
      '**Category** (e.g. PvE, PvP):',
      '',
      '**JSON Data:**',
      '',
      '**Reasoning (optional):**',
      '',
    ].join('\n'),
    labels: 'tier-list',
  }).toString();

const TIER_ORDER: Tier[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

const TIER_COLOR: Record<Tier, string> = {
  'S+': 'pink',
  S: 'red',
  A: 'orange',
  B: 'yellow',
  C: 'green',
  D: 'gray',
};

const QUALITY_BORDER_COLOR: Record<string, string> = {
  'SSR EX': 'var(--mantine-color-red-6)',
  'SSR+': 'var(--mantine-color-orange-5)',
  SSR: 'var(--mantine-color-yellow-5)',
  'SR+': 'var(--mantine-color-violet-5)',
  R: 'var(--mantine-color-blue-5)',
  N: 'var(--mantine-color-gray-5)',
};

export default function TierList() {
  const { data: categories, loading: loadingTiers } = useDataFetch<TierListCategory[]>(
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
              href={SUGGEST_URL}
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
              <Tabs defaultValue={categories[0]?.name}>
                <Tabs.List>
                  {categories.map((cat) => (
                    <Tabs.Tab key={cat.name} value={cat.name}>
                      {cat.name}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>

                {categories.map((cat) => {
                  const visibleEntries = cat.entries.filter((e) => filteredNames.has(e.characterName));
                  const byTier = TIER_ORDER.map((tier) => ({
                    tier,
                    entries: visibleEntries.filter((e) => e.tier === tier),
                  })).filter((g) => g.entries.length > 0);

                  return (
                    <Tabs.Panel key={cat.name} value={cat.name} pt="md">
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
                                  const char = charMap.get(entry.characterName);
                                  const borderColor = char
                                    ? QUALITY_BORDER_COLOR[char.quality]
                                    : undefined;
                                  return (
                                    <Stack key={entry.characterName} gap={2} align="center">
                                      <Image
                                        src={getPortrait(entry.characterName)}
                                        alt={entry.characterName}
                                        h={80}
                                        w={80}
                                        fit="cover"
                                        radius="50%"
                                        style={{
                                          border: `3px solid ${borderColor ?? 'var(--mantine-color-gray-5)'}`,
                                        }}
                                      />
                                      <Text size="xs" fw={500} ta="center" lineClamp={1}>
                                        {entry.characterName}
                                      </Text>
                                    </Stack>
                                  );
                                })}
                              </SimpleGrid>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Tabs.Panel>
                  );
                })}
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
