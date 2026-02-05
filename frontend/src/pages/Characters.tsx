import {
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import CharacterList from '../components/CharacterList';
import SuggestModal from '../components/SuggestModal';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import { CHARACTER_JSON_TEMPLATE } from '../utils/github-issues';

export default function Characters() {
  const { data: characters, loading } = useDataFetch<Character[]>(
    'data/characters.json',
    [],
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
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && characters.length === 0 && (
          <Text c="dimmed">Character data will appear here once available.</Text>
        )}

        {!loading && characters.length > 0 && <CharacterList characters={characters} />}
      </Stack>
    </Container>
  );
}
