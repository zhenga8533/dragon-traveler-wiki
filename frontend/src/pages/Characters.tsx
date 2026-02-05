import {
  Badge,
  Button,
  Center,
  Collapse,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import { IoAddCircleOutline, IoFilter } from 'react-icons/io5';
import CharacterCard from '../components/CharacterCard';
import CharacterFilter from '../components/CharacterFilter';
import { QUALITY_COLOR, QUALITY_ORDER } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { CharacterFilters } from '../utils/filter-characters';
import { EMPTY_FILTERS, extractAllEffectRefs, filterCharacters } from '../utils/filter-characters';
import { CHARACTER_SUGGEST_URL } from '../utils/github-issues';

export default function Characters() {
  const { data: characters, loading } = useDataFetch<Character[]>(
    'data/characters.json',
    [],
  );

  const [filters, setFilters] = useState<CharacterFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);

  const effectOptions = useMemo(() => extractAllEffectRefs(characters), [characters]);
  const filtered = useMemo(() => filterCharacters(characters, filters), [characters, filters]);

  const groupedByQuality = useMemo(() => {
    return QUALITY_ORDER.map((quality) => ({
      quality,
      characters: filtered.filter((c) => c.quality === quality),
    })).filter((g) => g.characters.length > 0);
  }, [filtered]);

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
          <Title order={1}>Characters</Title>
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
              href={CHARACTER_SUGGEST_URL}
              target="_blank"
              variant="light"
              size="xs"
              leftSection={<IoAddCircleOutline size={16} />}
            >
              Suggest a Character
            </Button>
          </Group>
        </Group>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && characters.length === 0 && (
          <Text c="dimmed">Character data will appear here once available.</Text>
        )}

        {!loading && characters.length > 0 && (
          <>
            <Collapse in={filterOpen}>
              <Paper p="md" radius="md" withBorder>
                <CharacterFilter
                  filters={filters}
                  onChange={setFilters}
                  effectOptions={effectOptions}
                />
              </Paper>
            </Collapse>

            {filtered.length === 0 && (
              <Text c="dimmed" size="sm" ta="center" py="md">
                No characters match the current filters.
              </Text>
            )}

            {groupedByQuality.map(({ quality, characters: chars }) => (
              <Paper key={quality} p="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Badge
                    variant="filled"
                    color={QUALITY_COLOR[quality]}
                    size="lg"
                    radius="sm"
                  >
                    {quality}
                  </Badge>
                  <SimpleGrid cols={{ base: 4, xs: 5, sm: 6, md: 8 }} spacing={4}>
                    {chars.map((char) => (
                      <CharacterCard
                        key={char.name}
                        name={char.name}
                        quality={char.quality}
                      />
                    ))}
                  </SimpleGrid>
                </Stack>
              </Paper>
            ))}
          </>
        )}
      </Stack>
    </Container>
  );
}
