import { Container, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { IoPeople } from 'react-icons/io5';
import CharacterList from '../components/CharacterList';
import EmptyState from '../components/EmptyState';
import { CharacterCardSkeleton } from '../components/SkeletonCard';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { CHARACTER_GRID_COLS, CHARACTER_GRID_SPACING } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';

const CHARACTER_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Character name' },
  { name: 'title', label: 'Title', type: 'text', placeholder: 'Character title' },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: ['SSR EX', 'SSR+', 'SSR', 'SR+', 'R', 'N'],
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
  { name: 'additional_info', label: 'Additional Info (optional)', type: 'textarea', placeholder: 'Any extra details about this character' },
];

export default function Characters() {
  const { data: characters, loading } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Title order={1}>Characters</Title>
          <SuggestModal
            buttonLabel="Suggest a Character"
            modalTitle="Suggest a New Character"
            issueTitle="[Character] New character suggestion"
            fields={CHARACTER_FIELDS}
            excludeFromJson={['additional_info']}
          />
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

        {!loading && characters.length === 0 && (
          <EmptyState
            icon={<IoPeople size={32} />}
            title="No characters yet"
            description="Character data will appear here once available."
          />
        )}

        {!loading && characters.length > 0 && (
          <CharacterList characters={characters} />
        )}
      </Stack>
    </Container>
  );
}
