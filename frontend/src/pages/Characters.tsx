import { Container, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { IoPeople } from 'react-icons/io5';
import CharacterList from '../components/CharacterList';
import EmptyState from '../components/EmptyState';
import { CharacterCardSkeleton } from '../components/SkeletonCard';
import SuggestModal from '../components/SuggestModal';
import { CHARACTER_GRID_COLS } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import { CHARACTER_JSON_TEMPLATE } from '../utils/github-issues';

export default function Characters() {
  const { data: characters, loading } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Characters</Title>
          <SuggestModal
            buttonLabel="Suggest a Character"
            modalTitle="Suggest a New Character"
            jsonTemplate={CHARACTER_JSON_TEMPLATE}
            issueLabel="character"
            issueTitle="[Character] New character suggestion"
          />
        </Group>

        {loading && (
          <SimpleGrid cols={CHARACTER_GRID_COLS} spacing={4}>
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
