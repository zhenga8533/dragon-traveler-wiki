import {
  Badge,
  Button,
  Center,
  Collapse,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import CharacterFilter from '../components/CharacterFilter';
import CharacterGrid from '../components/CharacterGrid';
import SuggestModal from '../components/SuggestModal';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { CharacterFilters } from '../utils/filter-characters';
import { EMPTY_FILTERS, extractAllEffectRefs, filterCharacters } from '../utils/filter-characters';
import { CHARACTER_JSON_TEMPLATE } from '../utils/github-issues';

export default function Characters() {
  const { data: characters, loading } = useDataFetch<Character[]>(
    'data/characters.json',
    [],
  );

  const [filters, setFilters] = useState<CharacterFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);

  const effectOptions = useMemo(() => extractAllEffectRefs(characters), [characters]);
  const filtered = useMemo(() => filterCharacters(characters, filters), [characters, filters]);

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
            <SuggestModal
              buttonLabel="Suggest a Character"
              modalTitle="Suggest a New Character"
              jsonTemplate={CHARACTER_JSON_TEMPLATE}
              issueLabel="character"
              issueTitle="[Character] New character suggestion"
            />
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

            {filtered.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="md">
                No characters match the current filters.
              </Text>
            ) : (
              <Paper p="md" radius="md" withBorder>
                <CharacterGrid characters={filtered} />
              </Paper>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
            