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
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import { IoFilter, IoSearch } from 'react-icons/io5';
import { FACTION_ICON_MAP } from '../assets/faction';
import CharacterCard from '../components/CharacterCard';
import CharacterFilter from '../components/CharacterFilter';
import SuggestModal from '../components/SuggestModal';
import TeamBuilder from '../components/TeamBuilder';
import { FACTION_COLOR } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character, FactionName } from '../types/character';
import type { Team } from '../types/team';
import type { CharacterFilters } from '../utils/filter-characters';
import { EMPTY_FILTERS, extractAllEffectRefs, filterCharacters } from '../utils/filter-characters';
import { TEAM_JSON_TEMPLATE } from '../utils/github-issues';

export default function Teams() {
  const { data: teams, loading: loadingTeams } = useDataFetch<Team[]>('data/teams.json', []);
  const { data: characters, loading: loadingChars } = useDataFetch<Character[]>(
    'data/characters.json',
    [],
  );
  const [filters, setFilters] = useState<CharacterFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'view' | 'builder'>('view');
  const loading = loadingTeams || loadingChars;

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

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      if (search && !team.name.toLowerCase().includes(search.toLowerCase())) return false;
      const hasVisibleChar = team.members.some((m) => filteredNames.has(m.character_name));
      if (!hasVisibleChar) return false;
      return true;
    });
  }, [teams, search, filteredNames]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Teams</Title>
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
              buttonLabel="Suggest a Team"
              modalTitle="Suggest a New Team"
              jsonTemplate={TEAM_JSON_TEMPLATE}
              issueLabel="team"
              issueTitle="[Team] New team suggestion"
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
              onChange={(val) => setMode(val as 'view' | 'builder')}
              data={[
                { label: 'View Teams', value: 'view' },
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
              <>
                <TextInput
                  placeholder="Search teams..."
                  leftSection={<IoSearch size={16} />}
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                />

                {filteredTeams.length === 0 && (
                  <Text c="dimmed" ta="center" py="lg">
                    {search ? 'No teams match your search.' : 'No teams match the current filters.'}
                  </Text>
                )}

                {filteredTeams.map((team) => (
                  <Paper key={team.name} p="md" radius="md" withBorder>
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <Group gap="sm">
                          <Image
                            src={FACTION_ICON_MAP[team.faction as FactionName]}
                            alt={team.faction}
                            w={24}
                            h={24}
                          />
                          <Text fw={600} size="lg">{team.name}</Text>
                        </Group>
                        <Group gap="xs">
                          <Badge variant="light" size="sm">{team.content_type}</Badge>
                          <Badge
                            variant="light"
                            size="sm"
                            color={FACTION_COLOR[team.faction as FactionName]}
                          >
                            {team.faction}
                          </Badge>
                        </Group>
                      </Group>

                      <Group gap="xs">
                        <Text size="sm" c="dimmed">By {team.author}</Text>
                        {team.description && (
                          <>
                            <Text size="sm" c="dimmed">•</Text>
                            <Text size="sm" c="dimmed">{team.description}</Text>
                          </>
                        )}
                      </Group>

                      <SimpleGrid cols={{ base: 4, xs: 5, sm: 6, md: 8 }} spacing={4}>
                        {team.members
                          .filter((m) => filteredNames.has(m.character_name))
                          .map((m) => {
                            const char = charMap.get(m.character_name);
                            return (
                              <div key={m.character_name} style={{ position: 'relative' }}>
                                <CharacterCard
                                  name={m.character_name}
                                  quality={char?.quality}
                                />
                                {m.overdrive_order != null && (
                                  <Badge
                                    size="lg"
                                    circle
                                    variant="filled"
                                    color="orange"
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      right: 0,
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    {m.overdrive_order}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                      </SimpleGrid>
                    </Stack>
                  </Paper>
                ))}
              </>
            )}

            {mode === 'builder' && (
              <TeamBuilder
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
