import {
  Accordion,
  Card,
  Center,
  Container,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { QUALITY_ICON_MAP } from '../assets/character_quality';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
import { getPortrait } from '../assets/portrait';
import CharacterFilter from '../components/CharacterFilter';
import RichText from '../components/RichText';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { StatusEffect } from '../types/status-effect';
import type { CharacterFilters } from '../utils/filter-characters';
import { EMPTY_FILTERS, extractAllEffectRefs, filterCharacters } from '../utils/filter-characters';

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
                      {getPortrait(char.name) && (
                        <Image
                          src={getPortrait(char.name)}
                          alt={char.name}
                          h={56}
                          w={56}
                          fit="cover"
                          radius="50%"
                        />
                      )}
                      <Stack gap={2}>
                        <Text fw={600} lineClamp={1}>{char.name}</Text>
                        <Group gap={4}>
                          <Image
                            src={QUALITY_ICON_MAP[char.quality]}
                            alt={char.quality}
                            w={16}
                            h={16}
                            fit="contain"
                          />
                          <Image
                            src={CLASS_ICON_MAP[char.character_class]}
                            alt={char.character_class}
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
