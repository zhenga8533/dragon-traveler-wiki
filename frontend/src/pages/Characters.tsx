import { useState, useMemo } from 'react';
import {
  Title,
  Text,
  Container,
  Stack,
  Loader,
  Center,
  Card,
  SimpleGrid,
  Group,
  Badge,
  Image,
  Accordion,
} from '@mantine/core';
import { useDataFetch } from '../hooks/use-data-fetch';
import CharacterFilter from '../components/CharacterFilter';
import RichText from '../components/RichText';
import { filterCharacters, extractAllEffectRefs, EMPTY_FILTERS } from '../utils/filter-characters';
import type { CharacterFilters } from '../utils/filter-characters';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
import type { Character } from '../types/character';
import type { StatusEffect } from '../types/status-effect';

const QUALITY_COLOR: Record<string, string> = {
  Myth: 'red',
  'Legend+': 'orange',
  Legend: 'yellow',
  Epic: 'violet',
  Elite: 'blue',
};

export default function Characters() {
  const { data: characters, loading: loadingChars } = useDataFetch<Character[]>(
    'data/characters.json',
    [],
  );
  const { data: statusEffects, loading: loadingEffects } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    [],
  );

  const [filters, setFilters] = useState<CharacterFilters>(EMPTY_FILTERS);
  const loading = loadingChars || loadingEffects;

  const effectOptions = useMemo(() => extractAllEffectRefs(characters), [characters]);
  const filtered = useMemo(() => filterCharacters(characters, filters), [characters, filters]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={1}>Characters</Title>

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
            <CharacterFilter
              filters={filters}
              onChange={setFilters}
              effectOptions={effectOptions}
            />

            {filtered.length === 0 && (
              <Text c="dimmed" size="sm" ta="center" py="md">
                No characters match the current filters.
              </Text>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {filtered.map((char) => (
                <Card key={char.name} padding="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group gap="sm" wrap="nowrap">
                      {char.portraits?.[0] && (
                        <Image
                          src={char.portraits[0]}
                          alt={char.name}
                          h={56}
                          w={56}
                          fit="cover"
                          radius="md"
                        />
                      )}
                      <Stack gap={2}>
                        <Text fw={600} lineClamp={1}>{char.name}</Text>
                        <Group gap={4}>
                          <Badge
                            variant="light"
                            color={QUALITY_COLOR[char.quality] ?? 'gray'}
                            size="xs"
                          >
                            {char.quality}
                          </Badge>
                          <Image
                            src={CLASS_ICON_MAP[char.characterClass]}
                            alt={char.characterClass}
                            w={16}
                            h={16}
                            fit="contain"
                          />
                          {char.factions.map((f) => (
                            <Image
                              key={f}
                              src={FACTION_ICON_MAP[f]}
                              alt={f}
                              w={16}
                              h={16}
                              fit="contain"
                            />
                          ))}
                        </Group>
                      </Stack>
                    </Group>

                    {char.abilities.length > 0 && (
                      <Accordion variant="contained" radius="sm">
                        {char.abilities.map((ability) => (
                          <Accordion.Item key={ability.name} value={ability.name}>
                            <Accordion.Control>
                              <Group gap="xs" wrap="nowrap">
                                {ability.icon && (
                                  <Image
                                    src={ability.icon}
                                    alt={ability.name}
                                    w={20}
                                    h={20}
                                    fit="contain"
                                  />
                                )}
                                <Text size="sm" fw={500}>{ability.name}</Text>
                              </Group>
                            </Accordion.Control>
                            <Accordion.Panel>
                              <RichText text={ability.description} statusEffects={statusEffects} />
                            </Accordion.Panel>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    )}
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </>
        )}
      </Stack>
    </Container>
  );
}
