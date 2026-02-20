import { Container, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { useMemo } from 'react';
import { IoPeople } from 'react-icons/io5';
import CharacterList from '../components/CharacterList';
import DataFetchError from '../components/DataFetchError';
import EmptyState from '../components/EmptyState';
import LastUpdated from '../components/LastUpdated';
import { CharacterCardSkeleton } from '../components/SkeletonCard';
import SuggestModal, {
  type ArrayFieldDef,
  type FieldDef,
} from '../components/SuggestModal';
import { CHARACTER_GRID_COLS, CHARACTER_GRID_SPACING } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Artifact } from '../types/artifact';
import type { Character } from '../types/character';

const CHARACTER_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Character name',
  },
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    placeholder: 'Character title',
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: ['UR', 'SSR EX', 'SSR+', 'SSR', 'SR', 'R', 'N'],
  },
  {
    name: 'character_class',
    label: 'Class',
    type: 'select',
    required: true,
    options: ['Guardian', 'Priest', 'Assassin', 'Warrior', 'Archer', 'Mage'],
  },
  {
    name: 'factions',
    label: 'Factions',
    type: 'text',
    placeholder: 'e.g. Elemental Echo, Wild Spirit',
  },
  { name: 'is_global', label: 'Available on Global server', type: 'boolean' },
  {
    name: 'additional_info',
    label: 'Additional Info (optional)',
    type: 'textarea',
    placeholder: 'Any extra details about this character',
  },
];

const FACTION_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Faction Name',
    type: 'select',
    required: true,
    options: [
      'Elemental Echo',
      'Wild Spirit',
      'Arcane Wisdom',
      'Sanctum Glory',
      'Otherworld Return',
      'Illusion Veil',
    ],
  },
  {
    name: 'wyrm',
    label: 'Wyrm',
    type: 'select',
    required: true,
    options: [
      'Fire Whelp',
      'Butterfly Whelp',
      'Emerald Whelp',
      'Shadow Whelp',
      'Light Whelp',
      'Dark Whelp',
    ],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Faction mechanics and identity',
  },
];

export default function Characters() {
  const {
    data: characters,
    loading,
    error,
  } = useDataFetch<Character[]>('data/characters.json', []);
  const { data: artifacts } = useDataFetch<Artifact[]>(
    'data/artifacts.json',
    []
  );

  const artifactOptions = useMemo(
    () =>
      artifacts
        .map((artifact) => artifact.name)
        .sort((a, b) => a.localeCompare(b)),
    [artifacts]
  );

  const factionArrayFields = useMemo<ArrayFieldDef[]>(
    () => [
      {
        name: 'recommended_artifacts',
        label: 'Recommended Artifacts',
        minItems: 1,
        fields: [
          {
            name: 'name',
            label: 'Artifact',
            type: 'select',
            required: true,
            options: artifactOptions,
          },
        ],
      },
    ],
    [artifactOptions]
  );

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    for (const c of characters) {
      if (c.last_updated > latest) latest = c.last_updated;
    }
    return latest;
  }, [characters]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm" align="baseline">
            <Title order={1}>Characters</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <Group gap="xs">
            <SuggestModal
              buttonLabel="Suggest a Character"
              modalTitle="Suggest a New Character"
              issueTitle="[Character] New character suggestion"
              fields={CHARACTER_FIELDS}
              excludeFromJson={['additional_info']}
            />
            <SuggestModal
              buttonLabel="Suggest Faction Artifacts"
              modalTitle="Suggest Faction Recommended Artifacts"
              issueTitle="[Faction] Faction recommendation update"
              fields={FACTION_FIELDS}
              arrayFields={factionArrayFields}
            />
          </Group>
        </Group>

        {loading && (
          <SimpleGrid
            cols={CHARACTER_GRID_COLS}
            spacing={CHARACTER_GRID_SPACING}
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <CharacterCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        )}

        {!loading && error && (
          <DataFetchError
            title="Could not load characters"
            message={error.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && characters.length === 0 && (
          <EmptyState
            icon={<IoPeople size={32} />}
            title="No characters yet"
            description="Character data will appear here once available."
          />
        )}

        {!loading && !error && characters.length > 0 && (
          <CharacterList characters={characters} />
        )}
      </Stack>
    </Container>
  );
}
